import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, CreditCard, Loader2, ShieldAlert, Wallet, type LucideIcon } from 'lucide-react';
import { RiskBadge } from '@/components/RiskBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { cardClass } from '@/components/ui';
import { formatDateTime, formatMoney } from '@/lib/format';
import { LEVEL_COPY, type RiskLevel } from '@/lib/riskEngine';
import { navigate } from '@/lib/router';
import { listTransactions, type TransactionRecord } from '@/lib/transactions';

const RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high'];
const BAR_CLASS: Record<RiskLevel, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-rose-500',
};

function StatCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint: string }) {
  return (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export function AdminPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listTransactions()
      .then((rows) => {
        if (active) setTransactions(rows);
      })
      .catch(() => {
        if (active) setError('We could not load transactions. Please refresh the page.');
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const rows = transactions ?? [];
    const distribution: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0 };
    rows.forEach((row) => {
      distribution[row.risk_level] += 1;
    });
    const total = rows.length;
    const successful = rows.filter((row) => row.status === 'paid' || row.status === 'approved').length;
    const failed = rows.filter((row) => row.status === 'declined').length;
    const queue = rows.filter((row) => row.status === 'under_review');
    const volume = rows
      .filter((row) => row.status === 'paid' || row.status === 'approved')
      .reduce((sum, row) => sum + row.amount, 0);
    return { total, successful, failed, distribution, queue, volume, highRisk: distribution.high };
  }, [transactions]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-inset ring-rose-600/20">{error}</p>
      </div>
    );
  }

  if (transactions === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-semibold text-emerald-700">Administrator</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Fraud monitoring</h1>
      <p className="mt-2 text-sm text-slate-600">Every assessed payment across the platform, with the manual review queue.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CreditCard} label="Total transactions" value={String(stats.total)} hint="All assessed payments" />
        <StatCard icon={CheckCircle2} label="Successful payments" value={String(stats.successful)} hint={`${formatMoney(stats.volume)} processed`} />
        <StatCard icon={Wallet} label="Failed or declined" value={String(stats.failed)} hint="Blocked after review" />
        <StatCard icon={ShieldAlert} label="High-risk payments" value={String(stats.highRisk)} hint="Score 70 or above" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className={cardClass}>
          <h2 className="text-sm font-semibold text-slate-900">Risk distribution</h2>
          <div className="mt-6 space-y-5">
            {RISK_LEVELS.map((level) => {
              const count = stats.distribution[level];
              const share = stats.total === 0 ? 0 : Math.round((count / stats.total) * 100);
              return (
                <div key={level}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{LEVEL_COPY[level].label}</span>
                    <span className="font-mono text-slate-600">{count} · {share}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full transition-[width] duration-700 ease-out ${BAR_CLASS[level]}`} style={{ width: `${share}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={cardClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Manual review queue</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
              <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
              {stats.queue.length} waiting
            </span>
          </div>
          {stats.queue.length === 0 ? (
            <p className="mt-6 text-sm text-slate-600">No payments are waiting for review.</p>
          ) : (
            <ul className="mt-5 divide-y divide-slate-100">
              {stats.queue.map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => navigate(`/risk/${row.id}`)}
                    className="flex w-full items-center justify-between gap-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{row.merchant_name}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(row.created_at)} · Score {row.risk_score}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatMoney(row.amount)}</p>
                      <div className="mt-1"><RiskBadge level={row.risk_level} /></div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-900">All transactions</h2>
        {stats.total === 0 ? (
          <div className={`${cardClass} mt-4 text-center text-sm text-slate-600`}>No transactions have been assessed yet.</div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Merchant</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Risk</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/risk/${row.id}`)}
                    className="cursor-pointer transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{formatDateTime(row.created_at)}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{row.merchant_name}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-900">{formatMoney(row.amount)}</td>
                    <td className="px-5 py-3.5"><RiskBadge level={row.risk_level} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
