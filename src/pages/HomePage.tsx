import { ArrowRight, BarChart3, CreditCard, Fingerprint, ScanSearch, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { navigate } from '@/lib/router';

const HERO_IMAGE =
  'https://images.pexels.com/photos/577210/pexels-photo-577210.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

const FEATURES = [
  {
    icon: ScanSearch,
    title: 'Real-time risk scoring',
    body: 'Every payment is scored from 0 to 100 using amount, account age, activity, device and timing signals.',
  },
  {
    icon: Sparkles,
    title: 'Explained decisions',
    body: 'Each score comes with the factors that pushed it up or down, so nothing is a black box.',
  },
  {
    icon: ShieldCheck,
    title: 'Risk-based actions',
    body: 'Low-risk payments go straight through, medium-risk payments need confirmation, and high-risk payments go to review.',
  },
  {
    icon: CreditCard,
    title: 'PayPal Sandbox checkout',
    body: 'Approved payments flow into a PayPal-style checkout so the full trust journey can be demonstrated end to end.',
  },
  {
    icon: BarChart3,
    title: 'Admin analytics',
    body: 'Monitor totals, risk distribution and the manual review queue from one dashboard.',
  },
  {
    icon: Fingerprint,
    title: 'Role-based access',
    body: 'Customers see their own history. Administrators see every transaction and resolve reviews.',
  },
];

const RISK_BANDS = [
  { level: 'Low', range: '0 to 39', action: 'Proceed to payment', tone: 'bg-emerald-500', text: 'text-emerald-700' },
  { level: 'Medium', range: '40 to 69', action: 'Additional verification', tone: 'bg-amber-500', text: 'text-amber-700' },
  { level: 'High', range: '70 to 100', action: 'Manual review', tone: 'bg-rose-500', text: 'text-rose-700' },
];

export function HomePage() {
  const { session } = useAuth();
  const startPath = session ? '/pay' : '/login';

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950">
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-emerald-950/70" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              AI-powered payment trust
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Stop fraud before
              <span className="text-emerald-400"> the payment goes through.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              PayGuard AI scores every payment for risk, explains why, and recommends the right next step. Customers get a clear answer. Merchants and admins get the visibility to act.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate(startPath)}
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
              >
                {session ? 'Open payment check' : 'Get started'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See how it works
              </button>
            </div>
          </div>

          <div className="animate-fade-up self-center rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sample assessment</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-5xl font-semibold tracking-tight text-white">24</p>
                <p className="mt-1 text-sm text-slate-400">Risk score out of 100</p>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
                Low risk
              </span>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-[24%] rounded-full bg-emerald-400" />
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                ['Established account (over one year)', '-6'],
                ['Payment from a known device', '0'],
                ['Typical amount for this account', '+4'],
              ].map(([label, value]) => (
                <li key={label} className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 text-slate-300">
                  <span>{label}</span>
                  <span className="font-mono font-semibold text-emerald-300">{value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-slate-400">Decision: proceed to payment.</p>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-emerald-700">Platform capabilities</p>
          <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-slate-900">
            Everything needed to make payments transparent and trusted.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-900/5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Risk-based decisions</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-slate-900">
              The score decides the next step, and the reasons are always shown.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Thresholds are set by the platform, not by a payment provider. You can see exactly which signals raised or lowered each score.
            </p>
          </div>
          <div className="space-y-4">
            {RISK_BANDS.map((band) => (
              <div key={band.level} className="flex items-center gap-5 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                <span className={`h-12 w-1.5 rounded-full ${band.tone}`} aria-hidden="true" />
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${band.text}`}>{band.level} risk</p>
                  <p className="text-sm text-slate-600">{band.action}</p>
                </div>
                <p className="font-mono text-sm font-medium text-slate-700">{band.range}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-slate-900 p-8 sm:flex-row sm:items-center sm:p-12">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Check your next payment in seconds.</h2>
            <p className="mt-2 text-sm text-slate-300">Create a free account and run your first risk assessment today.</p>
          </div>
          <button
            onClick={() => navigate(startPath)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            {session ? 'Open payment check' : 'Create account'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
