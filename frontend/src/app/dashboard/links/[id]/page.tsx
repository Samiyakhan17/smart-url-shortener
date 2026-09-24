
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';

type LinkDetail = {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  state: string;
  clickCount: number;
  createdAt: string;
  expiresAt: string | null;
};

type AnalyticsData = {
  totalClicks: number;
  lastClickedAt: string | null;
  referrers: { name: string; clicks: number }[];
  devices: { name: string; clicks: number }[];
  browsers: { name: string; clicks: number }[];
  operatingSystems: { name: string; clicks: number }[];
  countries: { name: string; clicks: number }[];
};

function Breakdown({
  title,
  rows,
  icon,
}: {
  title: string;
  rows: { name: string; clicks: number }[];
  icon: string;
})
{
  const total = rows.reduce((sum, row) => sum + row.clicks, 0);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B2D959]/20 text-lg">
            {icon}
          </div>

          <h3 className="font-semibold text-[#263026]">
            {title}
          </h3>
        </div>

        {rows.length > 0 && (
          <span className="text-xs text-[#8FA28A]">
            {total} clicks
          </span>
        )}
      </div>

      <div className="mt-5">
        {rows.length === 0 ? (
          <div className="rounded-xl bg-[#F8FAF6] px-4 py-6 text-center">
            <p className="text-sm text-[#8FA28A]">
              No data yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between rounded-xl bg-[#F8FAF6] px-4 py-3"
              >
                <span className="min-w-0 truncate text-sm text-[#263026]">
                  {row.name}
                </span>

                <span className="ml-4 rounded-lg bg-[#B2D959]/20 px-2.5 py-1 text-xs font-semibold text-[#6A943E]">
                  {row.clicks}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LinkDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [link, setLink] = useState<LinkDetail | null>(null);
  const [analytics, setAnalytics] =
    useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadLinkDetails = async () => {
      try {
        setError('');

        const [linkRes, analyticsRes] = await Promise.all([
          api.get<{ data: LinkDetail }>(`/urls/${id}`),
          api.get<{ data: AnalyticsData }>(
            `/urls/${id}/analytics`
          ),
        ]);

        setLink(linkRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Failed to load link.'
        );
      }
    };

    loadLinkDetails();
  }, [id]);

  async function copyShortUrl() {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  function formatDate(date: string | null) {
    if (!date) return 'Never';

    return new Date(date).toLocaleString();
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAF6] px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/dashboard/links"
            className="inline-flex items-center text-sm font-medium text-[#8FA28A] transition hover:text-[#7EC151]"
          >
            ← Back to My Links
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-[#F8FAF6] px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="h-4 w-28 rounded bg-[#8FA28A]/20" />

            <div className="mt-8 h-8 w-64 rounded bg-[#8FA28A]/20" />

            <div className="mt-3 h-4 w-96 max-w-full rounded bg-[#8FA28A]/20" />

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="h-32 rounded-2xl bg-white" />
              <div className="h-32 rounded-2xl bg-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isActive =
    link.state.toLowerCase() === 'active';

  return (
    <div className="min-h-screen bg-[#F8FAF6]">
      <main className="px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">

          {/* Back */}
          <Link
            href="/dashboard/links"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#8FA28A] transition hover:text-[#7EC151]"
          >
            ← Back to My Links
          </Link>

          {/* Page header */}
          <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-[#263026]">
                  {link.title || link.shortCode}
                </h1>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isActive
                      ? 'bg-[#B2D959]/25 text-[#5D8634]'
                      : 'bg-[#8FA28A]/15 text-[#68776A]'
                  }`}
                >
                  {link.state}
                </span>
              </div>

              <p className="mt-2 text-sm text-[#8FA28A]">
                Link details and performance overview
              </p>
            </div>
          </div>

          {/* Main link card */}
          <section className="mt-8 rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8FA28A]">
                  Short URL
                </p>

                <a
                  href={link.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block truncate text-xl font-bold text-[#7EC151] transition hover:text-[#6A943E]"
                >
                  {link.shortUrl}
                </a>

                <p className="mt-3 break-all text-sm leading-6 text-[#8FA28A]">
                  {link.originalUrl}
                </p>
              </div>

              <button
                type="button"
                onClick={copyShortUrl}
                className="shrink-0 rounded-xl bg-[#7EC151] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#70B344] hover:shadow-md"
              >
                {copied ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>

            <div className="mt-6 grid gap-4 border-t border-black/5 pt-6 sm:grid-cols-3">

              <div>
                <p className="text-xs text-[#8FA28A]">
                  Short code
                </p>

                <p className="mt-1 text-sm font-semibold text-[#263026]">
                  {link.shortCode}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#8FA28A]">
                  Created
                </p>

                <p className="mt-1 text-sm font-semibold text-[#263026]">
                  {formatDate(link.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#8FA28A]">
                  Expires
                </p>

                <p className="mt-1 text-sm font-semibold text-[#263026]">
                  {link.expiresAt
                    ? formatDate(link.expiresAt)
                    : 'Never'}
                </p>
              </div>

            </div>
          </section>

          {/* Statistics */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2">

            {/* Total clicks */}
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#8FA28A]">
                  Total Clicks
                </p>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#B2D959]/20 text-lg text-[#7EC151]">
                  ↗
                </div>
              </div>

              <p className="mt-5 text-3xl font-bold text-[#263026]">
                {analytics?.totalClicks ?? link.clickCount ?? 0}
              </p>

              <p className="mt-1 text-xs text-[#8FA28A]">
                Total visits to this short link
              </p>
            </div>

            {/* Last clicked */}
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#8FA28A]">
                  Last Clicked
                </p>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#B2D959]/20 text-lg text-[#7EC151]">
                  ◷
                </div>
              </div>

              <p className="mt-5 text-lg font-bold text-[#263026]">
                {formatDate(
                  analytics?.lastClickedAt ?? null
                )}
              </p>

              <p className="mt-1 text-xs text-[#8FA28A]">
                Most recent visit
              </p>
            </div>
          </div>

          {/* Analytics */}
          <div className="mt-10">
            <div>
              <h2 className="text-xl font-bold text-[#263026]">
                Analytics
              </h2>

              <p className="mt-1 text-sm text-[#8FA28A]">
                Understand how people are interacting with
                your link.
              </p>
            </div>

            {analytics ? (
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Breakdown
                  title="Referrers"
                  rows={analytics.referrers}
                  icon="↗"
                />

                <Breakdown
                  title="Devices"
                  rows={analytics.devices}
                  icon="▣"
                />

                <Breakdown
                  title="Browsers"
                  rows={analytics.browsers}
                  icon="◉"
                />

                <Breakdown
                  title="Operating Systems"
                  rows={analytics.operatingSystems}
                  icon="⌘"
                />

                <Breakdown
                  title="Countries"
                  rows={analytics.countries}
                  icon="◎"
                />
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
                <p className="text-sm text-[#8FA28A]">
                  Analytics data is not available yet.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
