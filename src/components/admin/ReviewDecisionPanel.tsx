import { useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { reviewTransaction } from '@/lib/transactions';
import { cardClass } from '@/components/ui';

interface ReviewDecisionPanelProps {
  transactionId: string;
  onReviewed: () => void;
}

export function ReviewDecisionPanel({ transactionId, onReviewed }: ReviewDecisionPanelProps) {
  const [pending, setPending] = useState<'approved' | 'declined' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (outcome: 'approved' | 'declined') => {
    setPending(outcome);
    setError(null);
    try {
      await reviewTransaction(transactionId, outcome);
      onReviewed();
    } catch {
      setError('The review could not be saved. Please try again.');
    } finally {
      setPending(null);
    }
  };

  return (
    <section className={cardClass}>
      <h3 className="text-sm font-semibold text-slate-900">Manual review</h3>
      <p className="mt-1 text-sm text-slate-600">Approve to clear the payment or decline to block it.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => decide('approved')}
          disabled={pending !== null}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === 'approved' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          Approve
        </button>
        <button
          type="button"
          onClick={() => decide('declined')}
          disabled={pending !== null}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === 'declined' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
          Decline
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-600/20">
          {error}
        </p>
      )}
    </section>
  );
}
