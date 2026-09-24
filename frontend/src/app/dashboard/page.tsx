'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';

type LinkItem = {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  state: string;
  clickCount: number;
  isFavorite: boolean;
  createdAt: string;
};

export default function DashboardHome() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const res = await api.get<{ data: LinkItem[] }>(
          '/urls?limit=50'
        );

        if (!cancelled) {
          setLinks(res.data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Failed to load dashboard data.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalLinks = links.length;

  const totalClicks = links.reduce(
    (total, link) => total + (link.clickCount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#F8FAF6]">
      {/* Header */}
      <header className="border-b border-black/5 bg-white">
        <div className="flex items-center justify-between px-6 py-6 lg:px-10">
          <div>
            <p className="text-sm text-[#8FA28A]">
              Overview
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Dashboard
            </h1>
          </div>

          <Link
            href="/dashboard/links"
            className="rounded-xl bg-[#7EC151] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#70B344] hover:shadow-md"
          >
            + Create Link
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">

          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold">
              Welcome back 👋
            </h2>

            <p className="mt-1 text-sm text-[#8FA28A]">
              Manage your short links from one place.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="grid gap-5 sm:grid-cols-2">

            {/* Total Links */}
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#8FA28A]">
                  Total Links
                </p>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B2D959]/20 text-[#7EC151]">
                  🔗
                </div>
              </div>

              <p className="mt-5 text-3xl font-bold">
                {loading ? '—' : totalLinks}
              </p>

              <p className="mt-1 text-xs text-[#8FA28A]">
                Short links created
              </p>
            </div>

            {/* Total Clicks */}
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#8FA28A]">
                  Total Clicks
                </p>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B2D959]/20 text-[#7EC151]">
                  ↗
                </div>
              </div>

              <p className="mt-5 text-3xl font-bold">
                {loading ? '—' : totalClicks}
              </p>

              <p className="mt-1 text-xs text-[#8FA28A]">
                Clicks across your links
              </p>
            </div>
          </div>

          {/* Create Link */}
          <section className="mt-8 flex min-h-[360px] items-center justify-center rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
            <div className="max-w-md text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF4D8] text-2xl">
                🔗
              </div>

              <h3 className="mt-6 text-2xl font-bold">
                {totalLinks === 0
                  ? 'Create your first short link'
                  : 'Create another short link'}
              </h3>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#8FA28A]">
                Turn a long URL into a clean, shareable link.
                Your created links will appear in your links
                dashboard.
              </p>

              <Link
                href="/dashboard/links"
                className="mt-7 inline-flex rounded-xl bg-[#7EC151] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#70B344] hover:shadow-md"
              >
                Create Link →
              </Link>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}