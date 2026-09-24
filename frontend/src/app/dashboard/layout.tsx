'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAF6] text-sm text-[#8FA28A]">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  // Use the logged-in user's name dynamically.
  const userName = user.name || 'User';

  const initials = userName
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAF6] text-[#171A17]">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-black/5 bg-white">
        
        {/* Logo */}
        <div className="border-b border-black/5 px-6 py-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B2D959] text-lg font-bold">
              ↗
            </div>

            <div>
              <p className="text-base font-bold tracking-tight">
                LinkSnap
              </p>
              <p className="text-[11px] text-[#8FA28A]">
                Shorten · Track · Grow
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#8FA28A]">
            Workspace
          </p>

          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl bg-[#EAF4D8] px-3 py-3 text-sm font-semibold text-[#5D763F]"
            >
              <span className="text-base">⌂</span>
              Dashboard
            </Link>

            <Link
              href="/dashboard/links"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#68746A] transition hover:bg-[#F5F7F3] hover:text-[#171A17]"
            >
              <span className="text-base">🔗</span>
              My Links
            </Link>

            <Link
              href="/dashboard/keys"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#68746A] transition hover:bg-[#F5F7F3] hover:text-[#171A17]"
            >
              <span className="text-base">🔑</span>
              API Keys
            </Link>
          </div>
        </nav>

        {/* Profile */}
        <div className="relative border-t border-black/5 p-4">
          {profileOpen && (
            <div className="absolute bottom-20 left-4 right-4 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
              <div className="border-b border-black/5 p-4">
                <p className="text-sm font-semibold">
                  {userName}
                </p>

                <p className="mt-1 truncate text-xs text-[#8FA28A]">
                  {user.email}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-[#68746A] transition hover:bg-[#F8FAF6] hover:text-red-600"
              >
                <span>↪</span>
                Log out
              </button>
            </div>
          )}

          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-[#F5F7F3]"
          >
            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B2D959] text-sm font-bold text-[#40552B]">
              {initials}
            </div>

            {/* Name */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {userName}
              </p>

              <p className="text-xs text-[#8FA28A]">
                Account
              </p>
            </div>

            <span className="text-xs text-[#8FA28A]">
              {profileOpen ? '⌃' : '⌄'}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="min-w-0 flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}