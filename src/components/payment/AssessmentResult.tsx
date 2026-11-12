import { useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { DECISION_COPY, LEVEL_COPY, type Assessment } from '@/lib/riskEngine';
import { completePayment, type TransactionRecord } from '@/lib/transactions';
import { navigate } from '@/lib/router';
import { RiskBadge } from '@/components/RiskBadge';
import { ScoreGauge } from '@/components/risk/ScoreGauge';
import { RiskFactorList } from '@/components/risk/RiskFactorList';
import { cardClass, primaryButtonClass, secondaryButtonClass } from '@/components/ui';
import { formatMoney } from '@/lib/format';

interface AssessmentResultProps {
  transaction: TransactionRecord;
  assessment: Assessment;
  onPaid: (reference: string) => void;
  onStartOver: () => void;
}

function createSandboxReference(): string {
  return `PAYPAL-SBX-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function AssessmentResult({ transaction, assessment, onPaid, onStartOver }: AssessmentResultProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const copy = DECISION_COPY[assessment.decision];
  const isPaid = transaction.status === 'paid';
  const canPay = transaction.status === 'awaiting_payment';
  const payDisabled = paying || (assessment.decision === 'verify' && !confirmed);

  const handlePay = async () => {
    setPaying(true);
    setPaymentError(null);
    const reference = createSandboxReference();
    try {
      await completePayment(transaction.id, reference);
      onPaid(reference);
    } catch {
      setPaymentError('The payment could not be completed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className={`${cardClass} animate-fade-up`}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ScoreGauge score={assessment.score} level={assessment.level} />
        <div className="min-w-0">
          <RiskBadge level={assessment.level} />
          <h2 className="mt-3 text-xl font-semibold text-slate-900">{copy.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{copy.summary}</p>
          <p className="mt-2 text-xs text-slate-500">
            {LEVEL_COPY[assessment.level].range} points · {formatMoney(transaction.amount)} to {transaction.merchant_name}
          </p>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">Why this score</h3>
        <div className="mt-4">
          <RiskFactorList factors={assessment.factors} />
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-6">
        {isPaid && (
          <div className="rounded-xl bg-emerald-50 p-5 ring-1 ring-inset ring-emerald-600/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Payment approved in PayPal Sandbox</p>
                <p className="mt-1 text-sm text-emerald-800">
                  Reference <span className="font-mono">{transaction.payment_reference}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {canPay && assessment.decision === 'verify' && (
          <label className="mb-5 flex cursor-pointer items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
            />
            <span>I confirm this payment is mine and that I authorise it to be sent to {transaction.merchant_name}.</span>
          </label>
        )}

        {canPay && (
          <div>
            <button
              type="button"
              onClick={handlePay}
              disabled={payDisabled}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FFC439] px-5 py-3 text-sm font-semibold text-[#003087] shadow-sm transition hover:bg-[#f4b92e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paying ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <span className="italic">Pay with</span> <span className="font-bold italic">PayPal</span>
                  <span className="rounded bg-[#003087]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">Sandbox</span>
                </>
              )}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Demo checkout. No real money moves in the PayPal Sandbox.
            </p>
            {paymentError && (
              <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-600/20">
                {paymentError}
              </p>
            )}
          </div>
        )}

        {transaction.status === 'under_review' && (
          <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-5 ring-1 ring-inset ring-rose-600/20">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
            <p className="text-sm text-rose-900">
              This payment is with our review team. You will not be charged until it is cleared.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => navigate(`/risk/${transaction.id}`)} className={secondaryButtonClass}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Open full risk report
          </button>
          <button type="button" onClick={onStartOver} className={`${primaryButtonClass} sm:ml-auto`}>
            New payment check
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
