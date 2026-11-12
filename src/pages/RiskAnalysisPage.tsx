import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { RiskBadge } from '@/components/RiskBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { ScoreGauge } from '@/components/risk/ScoreGauge';
import { RiskFactorList } from '@/components/risk/RiskFactorList';
import { ReviewDecisionPanel } from '@/components/admin/ReviewDecisionPanel';
import { cardClass, secondaryButtonClass } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { formatDateTime, formatMoney } from '@/lib/format';
import { DECISION_COPY } from '@/lib/riskEngine';
import { navigate } from '@/lib/router';
import { getTransaction, type TransactionRecord } from '@/lib/transactions';

const DEVICE_LABEL: Record<TransactionRecord['device_type'], string> = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export function RiskAnalysisPage({ transactionId }: { transactionId: string }) {
  const { profile } = useAuth();
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTransaction(await getTransaction(transactionId));
    } catch {
      setError('We could not load this risk report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    load();
  }, [load]);

  const backPath = profile?.role === 'admin' ? '/admin' : '/history';

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" aria-label="Loading" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-inset ring-rose-600/20">{error}</p>
        <button onClick={load} className={`${secondaryButtonClass} mt-6`}>Try again</button>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-slate-900">Report not found</h1>
        <p className="mt-2 text-sm text-slate-600">This risk report does not exist or you do not have access to it.</p>
        <button onClick={() => navigate(backPath)} className={`${secondaryButtonClass} mt-6`}>Go back</button>
      </div>
    );
  }

  const copy = DECISION_COPY[transaction.decision];
  const canReview = profile?.role === 'admin' && transaction.status === 'under_review';

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <button
        onClick={() => navigate(backPath)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </button>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Risk analysis</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{transaction.merchant_name}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {formatMoney(transaction.amount)} · {formatDateTime(transaction.created_at)}
          </p>
        </div>
        <StatusBadge status={transaction.status} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className={`${cardClass} space-y-6`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <ScoreGauge score={transaction.risk_score} level={transaction.risk_level} />
            <div>
              <RiskBadge level={transaction.risk_level} />
              <h2 className="mt-3 text-xl font-semibold text-slate-900">{copy.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{copy.summary}</p>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-900">Factors behind this score</h3>
            <p className="mt-1 text-xs text-slate-500">Positive points raised the risk. Negative points lowered it.</p>
            <div className="mt-5">
              <RiskFactorList factors={transaction.risk_factors} />
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className={cardClass}>
            <h3 className="text-sm font-semibold text-slate-900">Payment and account signals</h3>
            <dl className="mt-4">
              <DetailRow label="Amount" value={formatMoney(transaction.amount)} />
              {transaction.item_description && <DetailRow label="Item" value={transaction.item_description} />}
              <DetailRow label="Country" value={transaction.payment_country} />
              <DetailRow label="Device" value={DEVICE_LABEL[transaction.device_type]} />
              <DetailRow label="New device" value={transaction.is_new_device ? 'Yes' : 'No'} />
              <DetailRow label="Account age" value={`${transaction.account_age_days} days`} />
              <DetailRow label="Payments in last 24 hours" value={String(transaction.transactions_last_24h)} />
              <DetailRow label="Local payment hour" value={`${String(transaction.local_hour).padStart(2, '0')}:00`} />
              {transaction.payment_reference && <DetailRow label="PayPal Sandbox reference" value={transaction.payment_reference} />}
            </dl>
          </section>

          {canReview && (
            <ReviewDecisionPanel transactionId={transaction.id} onReviewed={load} />
          )}
        </div>
      </div>
    </div>
  );
}
