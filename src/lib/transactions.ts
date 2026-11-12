import { supabase } from '@/lib/supabase';
import type { Assessment, AssessmentInput, Decision, RiskFactor, RiskLevel } from '@/lib/riskEngine';

export type TransactionStatus = 'awaiting_payment' | 'paid' | 'under_review' | 'approved' | 'declined';

export interface TransactionDraft extends AssessmentInput {
  merchantName: string;
  itemDescription: string;
}

export interface TransactionRecord {
  id: string;
  user_id: string;
  merchant_name: string;
  item_description: string;
  amount: number;
  payment_country: string;
  device_type: AssessmentInput['deviceType'];
  is_new_device: boolean;
  account_age_days: number;
  transactions_last_24h: number;
  local_hour: number;
  risk_score: number;
  risk_level: RiskLevel;
  decision: Decision;
  risk_factors: RiskFactor[];
  status: TransactionStatus;
  payment_reference: string | null;
  created_at: string;
}

const TRANSACTION_COLUMNS = '*';

function toRecord(row: TransactionRecord): TransactionRecord {
  return { ...row, amount: Number(row.amount), risk_factors: Array.isArray(row.risk_factors) ? row.risk_factors : [] };
}

export async function createTransaction(draft: TransactionDraft, assessment: Assessment): Promise<TransactionRecord> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      merchant_name: draft.merchantName,
      item_description: draft.itemDescription,
      amount: draft.amount,
      payment_country: draft.paymentCountry,
      device_type: draft.deviceType,
      is_new_device: draft.isNewDevice,
      account_age_days: draft.accountAgeDays,
      transactions_last_24h: draft.transactionsLast24h,
      local_hour: draft.localHour,
      risk_score: assessment.score,
      risk_level: assessment.level,
      decision: assessment.decision,
      risk_factors: assessment.factors,
      status: assessment.decision === 'review' ? 'under_review' : 'awaiting_payment',
    })
    .select(TRANSACTION_COLUMNS)
    .single();
  if (error) throw error;
  return toRecord(data as TransactionRecord);
}

export async function listTransactions(ownerId?: string): Promise<TransactionRecord[]> {
  let query = supabase.from('transactions').select(TRANSACTION_COLUMNS).order('created_at', { ascending: false });
  if (ownerId) query = query.eq('user_id', ownerId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as TransactionRecord[]).map(toRecord);
}

export async function getTransaction(id: string): Promise<TransactionRecord | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toRecord(data as TransactionRecord) : null;
}

export async function completePayment(transactionId: string, reference: string): Promise<void> {
  const { error } = await supabase.rpc('complete_payment', {
    p_transaction_id: transactionId,
    p_reference: reference,
  });
  if (error) throw error;
}

export async function reviewTransaction(transactionId: string, outcome: 'approved' | 'declined'): Promise<void> {
  const { error } = await supabase.rpc('admin_review_transaction', {
    p_transaction_id: transactionId,
    p_status: outcome,
  });
  if (error) throw error;
}
