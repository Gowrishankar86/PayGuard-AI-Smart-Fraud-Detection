/*
# Clarify transaction insert policy

1. Summary
Customers can create transactions only for themselves, and only in the two starting states the app uses (awaiting payment, or under review).

2. Security
- Replaces the `insert_own_transactions` policy with an explicit condition.
- No table or column changes.
*/

DROP POLICY IF EXISTS "insert_own_transactions" ON public.transactions;
CREATE POLICY "insert_own_transactions" ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('awaiting_payment', 'under_review')
    AND payment_reference IS NULL
  );
