import { useState } from 'react';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { AssessmentResult } from '@/components/payment/AssessmentResult';
import { assessTransaction, type Assessment } from '@/lib/riskEngine';
import { createTransaction, type TransactionDraft, type TransactionRecord } from '@/lib/transactions';

interface AssessedPayment {
  transaction: TransactionRecord;
  assessment: Assessment;
}

export function PaymentPage() {
  const [assessed, setAssessed] = useState<AssessedPayment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (draft: TransactionDraft) => {
    setSubmitting(true);
    setError(null);
    const assessment = assessTransaction(draft);
    try {
      const transaction = await createTransaction(draft, assessment);
      setAssessed({ transaction, assessment });
    } catch {
      setError('We could not save this risk check. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaid = (reference: string) => {
    setAssessed((current) =>
      current ? { ...current, transaction: { ...current.transaction, status: 'paid', payment_reference: reference } } : current,
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-emerald-700">Payment check</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-slate-900">Check risk, then pay with confidence.</h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Every payment is scored before checkout and the reasons are shown in plain language.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
        {assessed ? (
          <AssessmentResult
            key={assessed.transaction.id}
            transaction={assessed.transaction}
            assessment={assessed.assessment}
            onPaid={handlePaid}
            onStartOver={() => setAssessed(null)}
          />
        ) : (
          <div className="order-2 lg:order-none">
            <PaymentForm submitting={submitting} onSubmit={handleSubmit} />
            {error && (
              <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-600/20">
                {error}
              </p>
            )}
          </div>
        )}

        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900">How decisions are made</h3>
            <ol className="mt-4 space-y-4 text-sm text-slate-600">
              <li className="flex gap-3"><span className="font-mono text-emerald-700">01</span>Payment details and account signals are scored from 0 to 100.</li>
              <li className="flex gap-3"><span className="font-mono text-emerald-700">02</span>Each factor shows how much it raised or lowered the score.</li>
              <li className="flex gap-3"><span className="font-mono text-emerald-700">03</span>Low risk proceeds, medium risk needs confirmation, high risk goes to review.</li>
            </ol>
          </div>
          <p className="px-1 text-xs leading-relaxed text-slate-500">
            Thresholds are PayGuard AI&apos;s own risk bands, not official payment network classifications.
          </p>
        </aside>
      </div>
    </div>
  );
}
