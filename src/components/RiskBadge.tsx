import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import type { RiskLevel } from '@/lib/riskEngine';
import { LEVEL_COPY } from '@/lib/riskEngine';

const STYLES: Record<RiskLevel, { badge: string; icon: typeof ShieldCheck }> = {
  low: { badge: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20', icon: ShieldCheck },
  medium: { badge: 'bg-amber-50 text-amber-800 ring-amber-600/20', icon: ShieldQuestion },
  high: { badge: 'bg-rose-50 text-rose-800 ring-rose-600/20', icon: ShieldAlert },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { badge, icon: Icon } = STYLES[level];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${badge}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {LEVEL_COPY[level].label}
    </span>
  );
}
