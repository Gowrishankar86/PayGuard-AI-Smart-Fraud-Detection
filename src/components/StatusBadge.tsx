import type { TransactionStatus } from '@/lib/transactions';

const STATUS_STYLES: Record<TransactionStatus, { label: string; className: string }> = {
  awaiting_payment: { label: 'Awaiting payment', className: 'bg-sky-50 text-sky-800 ring-sky-600/20' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20' },
  under_review: { label: 'Under review', className: 'bg-amber-50 text-amber-800 ring-amber-600/20' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20' },
  declined: { label: 'Declined', className: 'bg-rose-50 text-rose-800 ring-rose-600/20' },
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style.className}`}>
      {style.label}
    </span>
  );
}
