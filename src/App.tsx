import { useEffect, type ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { navigate, useCurrentPath } from '@/lib/router';
import { Navbar } from '@/components/Navbar';
import { HomePage } from '@/pages/HomePage';
import { AuthPage } from '@/pages/AuthPage';
import { PaymentPage } from '@/pages/PaymentPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { RiskAnalysisPage } from '@/pages/RiskAnalysisPage';
import { AdminPage } from '@/pages/AdminPage';
import { cardClass, primaryButtonClass } from '@/components/ui';

function RequireSignIn({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) navigate('/login');
  }, [loading, session]);

  if (loading) return <FullPageSpinner />;
  if (!session) return null;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { profile } = useAuth();

  if (profile?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <div className={cardClass}>
          <h1 className="text-xl font-semibold text-slate-900">Administrator access only</h1>
          <p className="mt-2 text-sm text-slate-600">This area is limited to PayGuard AI administrators.</p>
          <button onClick={() => navigate('/pay')} className={`${primaryButtonClass} mt-6`}>Back to payment check</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function FullPageSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ShieldCheck className="h-8 w-8 animate-pulse text-emerald-600" aria-label="Loading" />
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-semibold text-emerald-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">This page does not exist</h1>
      <button onClick={() => navigate('/')} className={`${primaryButtonClass} mt-6`}>Go to home</button>
    </div>
  );
}

function renderRoute(path: string): ReactNode {
  const riskMatch = path.match(/^\/risk\/([^/]+)$/);
  if (riskMatch) {
    return (
      <RequireSignIn>
        <RiskAnalysisPage transactionId={riskMatch[1]} />
      </RequireSignIn>
    );
  }

  switch (path) {
    case '/':
      return <HomePage />;
    case '/login':
      return <AuthPage />;
    case '/pay':
      return (
        <RequireSignIn>
          <PaymentPage />
        </RequireSignIn>
      );
    case '/history':
      return (
        <RequireSignIn>
          <HistoryPage />
        </RequireSignIn>
      );
    case '/admin':
      return (
        <RequireSignIn>
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        </RequireSignIn>
      );
    default:
      return <NotFoundPage />;
  }
}

function AppShell() {
  const path = useCurrentPath();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      <Navbar currentPath={path} />
      <main className="flex-1">{renderRoute(path)}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            PayGuard AI. Explainable payment risk intelligence.
          </p>
          <p>Thresholds are PayGuard AI risk bands. PayPal Sandbox is used for demonstration only.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
