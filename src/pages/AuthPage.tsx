import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { navigate } from '@/lib/router';

type Mode = 'signin' | 'register';
type AccountType = 'customer' | 'merchant';

function friendlyError(error: Error): string {
  const message = error.message.toLowerCase();
  if (message.includes('invalid login')) return 'Email or password is incorrect.';
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (message.includes('password')) return 'Password must be at least 8 characters.';
  if (message.includes('fetch') || message.includes('network')) return 'We could not reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}

export function AuthPage() {
  const { session, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate('/pay');
  }, [session]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    if (mode === 'signin') {
      const signInError = await signIn(email.trim(), password);
      if (signInError) setError(friendlyError(signInError));
    } else {
      const result = await signUp({ email: email.trim(), password, fullName: fullName.trim(), role: accountType });
      if (result.error) {
        setError(friendlyError(result.error));
      } else if (result.needsConfirmation) {
        setNotice('Account created. Check your inbox to confirm your email, then sign in.');
        setMode('signin');
      }
    }
    setSubmitting(false);
  };

  const isRegister = mode === 'register';

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-16">
      <div className="hidden lg:block">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Secure payment risk checks
        </div>
        <h1 className="mt-6 text-4xl font-semibold leading-[1.15] tracking-tight text-slate-900">
          Know the risk before you pay.
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
          Create an account to run payment risk checks, follow every decision with its reasons, and keep a full history of your transactions.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1" role="tablist">
            {(['signin', 'register'] as Mode[]).map((value) => (
              <button
                key={value}
                role="tab"
                aria-selected={mode === value}
                onClick={() => switchMode(value)}
                className={`rounded-md py-2 text-sm font-semibold transition-all ${
                  mode === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {value === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-slate-900">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {isRegister ? 'It takes less than a minute.' : 'Sign in to continue to PayGuard AI.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isRegister && (
              <>
                <div>
                  <label htmlFor="full-name" className="block text-sm font-medium text-slate-700">Full name</label>
                  <input
                    id="full-name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={120}
                    autoComplete="name"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
                  />
                </div>
                <fieldset>
                  <legend className="block text-sm font-medium text-slate-700">I am registering as</legend>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {(['customer', 'merchant'] as AccountType[]).map((value) => (
                      <label
                        key={value}
                        className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition ${
                          accountType === value
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                            : 'border-slate-300 text-slate-600 hover:border-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="account-type"
                          value={value}
                          checked={accountType === value}
                          onChange={() => setAccountType(value)}
                          className="sr-only"
                        />
                        {value === 'customer' ? 'Customer' : 'Merchant'}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
              />
              {isRegister && <p className="mt-1.5 text-xs text-slate-500">At least 8 characters.</p>}
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-600/20">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  {isRegister ? 'Create account' : 'Sign in'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
