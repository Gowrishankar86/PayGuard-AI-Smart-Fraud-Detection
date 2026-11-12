import type { RiskLevel } from '@/lib/riskEngine';
import { LEVEL_COPY } from '@/lib/riskEngine';

const STROKE: Record<RiskLevel, string> = {
  low: 'stroke-emerald-500',
  medium: 'stroke-amber-500',
  high: 'stroke-rose-500',
};

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreGauge({ score, level }: { score: number; level: RiskLevel }) {
  const offset = CIRCUMFERENCE * (1 - score / 100);
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="10" className="stroke-slate-100" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={`${STROKE[level]} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight text-slate-900">{score}</span>
        <span className="text-xs text-slate-500">of 100</span>
      </div>
      <span className="sr-only">Risk score {score} out of 100, {LEVEL_COPY[level].label}</span>
    </div>
  );
}
