import { useEffect, useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { RiskBadge } from '@/components/RiskBadge';
import { cardClass } from '@/components/ui';
import { formatDateTime, formatMoney } from '@/lib/format';
import { navigate } from '@/lib/router';
import { useAuth } from '@/lib/AuthContext';
import { listTransactions, type TransactionRecord } from '@/lib/transactions';

export function HistoryPage() {
  const { session } = useAuth();
  const [transactions, setTransactions] = useState<TransactionRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    listTransactions(session.user.id)
      .then((rows) => {
        if (active) setTransactions(rows);
      })
      .catch(() => {
        if (active) setError('We could not load your transactions. Please refresh the page.');
      });
    return () => {
      active = false;
    };
  }, [session]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-semibold text-emerald-700">Transaction history</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Your payment checks</h1>
      <p className="mt-2 text-sm text-slate-600">Select any payment to see its full risk report.</p>

      <div className="mt-8">
        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-inset ring-rose-600/20">{error}</p>
        )}

        {!error && transactions === null && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" aria-label="Loading" />
          </div>
        )}

        {transactions !== null && transactions.length === 0 && (
          <div className={`${cardClass} text-center`}>
            <p className="text-base font-semibold text-slate-900">No payment checks yet</p>
            <p className="mt-1 text-sm text-slate-600">Run your first risk check and it will appear here.</p>
            <button
              onClick={() => navigate('/pay')}
              className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Make a payment
            </button>
          </div>
        )}

        {transactions !== null && transactions.length > 0 && (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {transactions.map((transaction) => (
              <li key={transaction.id}>
                <button
                  onClick={() => navigate(`/risk/${transaction.id}`)}
                  className="group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{transaction.merchant_name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(transaction.created_at)}</p>
                  </div>
                  <div className="hidden sm:block">
                    <RiskBadge level={transaction.risk_level} />
                  </div>
                  <div className="hidden text-right md:block">
                    <p className="font-mono text-xs text-slate-500">Score {transaction.risk_score}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <p className="text-sm font-semibold text-slate-900">{formatMoney(transaction.amount)}</p>
                    <StatusBadge status={transaction.status} />
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
