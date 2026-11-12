import { useState } from 'react';
import { Menu, ShieldCheck, X, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { navigate } from '@/lib/router';

interface NavItem {
  label: string;
  path: string;
  adminOnly?: boolean;
  requiresAuth?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Make a payment', path: '/pay', requiresAuth: true },
  { label: 'History', path: '/history', requiresAuth: true },
  { label: 'Admin', path: '/admin', requiresAuth: true, adminOnly: true },
];

export function Navbar({ currentPath }: { currentPath: string }) {
  const { session, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.requiresAuth && !session) return false;
    if (item.adminOnly && profile?.role !== 'admin') return false;
    return true;
  });

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button onClick={() => go('/')} className="flex items-center gap-2 text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight">PayGuard AI</span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {visibleItems.map((item) => (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                currentPath === item.path ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
          {session ? (
            <button
              onClick={handleSignOut}
              className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          ) : (
            <button
              onClick={() => go('/login')}
              className="ml-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Sign in
            </button>
          )}
        </nav>

        <button
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {visibleItems.map((item) => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {item.label}
              </button>
            ))}
            {session ? (
              <button onClick={handleSignOut} className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
                Sign out
              </button>
            ) : (
              <button onClick={() => go('/login')} className="rounded-md px-3 py-2.5 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
                Sign in
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
