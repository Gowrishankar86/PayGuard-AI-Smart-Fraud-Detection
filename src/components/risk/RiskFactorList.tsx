import type { RiskFactor } from '@/lib/riskEngine';

export function RiskFactorList({ factors }: { factors: RiskFactor[] }) {
  if (factors.length === 0) {
    return <p className="text-sm text-slate-600">No risk signals were raised for this payment.</p>;
  }

  const maxMagnitude = Math.max(...factors.map((factor) => Math.abs(factor.points)));

  return (
    <ul className="space-y-4">
      {factors.map((factor) => {
        const raises = factor.points > 0;
        const width = Math.max(8, (Math.abs(factor.points) / maxMagnitude) * 100);
        return (
          <li key={factor.id + factor.label}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-900">{factor.label}</p>
              <span className={`font-mono text-sm font-semibold ${raises ? 'text-rose-700' : 'text-emerald-700'}`}>
                {raises ? `+${factor.points}` : factor.points}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ease-out ${raises ? 'bg-rose-400' : 'bg-emerald-400'}`}
                style={{ width: `${width}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{factor.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}
