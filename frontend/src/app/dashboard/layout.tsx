'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-sm text-gray-500">Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="w-56 border-r flex flex-col p-4 gap-1">
        <div className="font-semibold mb-4">URL Shortener</div>
        <Link href="/dashboard" className="text-sm px-2 py-1.5 rounded hover:bg-gray-100">
          Dashboard
        </Link>
        <Link href="/dashboard/links" className="text-sm px-2 py-1.5 rounded hover:bg-gray-100">
          My Links
        </Link>
        <Link href="/dashboard/keys" className="text-sm px-2 py-1.5 rounded hover:bg-gray-100">
          API Keys
        </Link>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">Signed in as {user.email}</span>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="text-sm border rounded px-3 py-1.5 hover:bg-gray-100"
          >
            Log out
          </button>
        </header>
        <main className="flex-1 min-w-0 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}