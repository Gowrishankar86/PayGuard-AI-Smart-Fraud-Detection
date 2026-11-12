/*
# PayGuard AI core schema

1. Summary
PayGuard AI stores user profiles, payment risk assessments and PayPal Sandbox payment references. Customers see only their own transactions, admins see every transaction and can resolve manual reviews.

2. New Tables
- `profiles`: one row per signed-in account (id, email, full_name, role). Role is one of customer, merchant, admin.
- `transactions`: each assessed payment (merchant, amount, country, device, account age, activity, risk score, risk level, decision, explanation factors, status, PayPal Sandbox reference).

3. Functions and triggers
- `handle_new_user()` creates a profile automatically when an account is registered. Only customer or merchant can be chosen at sign-up; admin must be granted manually.
- `is_admin()` reports whether the current user is an admin.
- `complete_payment(...)` marks the owner's approved payment as paid.
- `admin_review_transaction(...)` lets an admin approve or decline a manual review case.

4. Security
- RLS enabled on both tables.
- Profiles: users can read and update only their own profile name; role cannot be changed by users.
- Transactions: users can read and insert only their own rows; admins can read all rows.
- Status changes go only through the two functions above, so customers cannot approve their own payments.

5. Notes
- Statements are idempotent and safe to re-run.
- Amounts are stored as numeric(12,2) so currency math stays exact.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'merchant', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'merchant' THEN 'merchant' ELSE 'customer' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name text NOT NULL CHECK (char_length(merchant_name) BETWEEN 1 AND 120),
  item_description text NOT NULL DEFAULT '' CHECK (char_length(item_description) <= 240),
  amount numeric(12,2) NOT NULL CHECK (amount > 0 AND amount <= 1000000),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  payment_country text NOT NULL CHECK (payment_country ~ '^[A-Z]{2}$'),
  device_type text NOT NULL CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  is_new_device boolean NOT NULL DEFAULT false,
  account_age_days integer NOT NULL CHECK (account_age_days >= 0),
  transactions_last_24h integer NOT NULL CHECK (transactions_last_24h >= 0),
  local_hour integer NOT NULL CHECK (local_hour BETWEEN 0 AND 23),
  risk_score integer NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  decision text NOT NULL CHECK (decision IN ('allow', 'verify', 'review')),
  risk_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'awaiting_payment'
    CHECK (status IN ('awaiting_payment', 'paid', 'under_review', 'approved', 'declined')),
  payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON public.transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_risk_level ON public.transactions (risk_level);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.transactions TO authenticated;

DROP POLICY IF EXISTS "select_own_or_admin_transactions" ON public.transactions;
CREATE POLICY "select_own_or_admin_transactions" ON public.transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_transactions" ON public.transactions;
CREATE POLICY "insert_own_transactions" ON public.transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'awaiting_payment' OR (auth.uid() = user_id AND status = 'under_review'));

CREATE OR REPLACE FUNCTION public.complete_payment(p_transaction_id uuid, p_reference text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_reference IS NULL OR char_length(p_reference) NOT BETWEEN 1 AND 120 THEN
    RAISE EXCEPTION 'Invalid payment reference';
  END IF;

  UPDATE public.transactions
  SET status = 'paid', payment_reference = p_reference
  WHERE id = p_transaction_id
    AND user_id = auth.uid()
    AND status = 'awaiting_payment'
    AND decision IN ('allow', 'verify');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction cannot be paid in its current state';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_payment(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_payment(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_review_transaction(p_transaction_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_status NOT IN ('approved', 'declined') THEN
    RAISE EXCEPTION 'Invalid review outcome';
  END IF;

  UPDATE public.transactions
  SET status = p_status
  WHERE id = p_transaction_id AND status = 'under_review';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction is not awaiting review';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_review_transaction(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_transaction(uuid, text) TO authenticated;
