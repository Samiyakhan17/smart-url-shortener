
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
}: {
  title: string;
  rows: { name: string; clicks: number }[];
}) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>

      {rows.length === 0 ? (
        <p className="text-xs text-gray-500">No data yet.</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((r) => (
            <li
              key={r.name}
              className="flex justify-between text-sm"
            >
              <span>{r.name}</span>
              <span className="text-gray-500">{r.clicks}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function LinkDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [link, setLink] = useState<LinkDetail | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const loadLinkDetails = async () => {
      try {
        setError('');

        const [linkRes, analyticsRes] = await Promise.all([
          api.get<{ data: LinkDetail }>(`/urls/${id}`),
          api.get<{ data: AnalyticsData }>(`/urls/${id}/analytics`),
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

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/links"
          className="text-sm text-gray-500 underline"
        >
          ← Back to My Links
        </Link>

        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!link) {
    return (
      <p className="text-sm text-gray-500">
        Loading...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/dashboard/links"
        className="inline-block text-sm underline text-gray-500 hover:text-gray-700"
      >
        ← Back to My Links
      </Link>

      {/* Link information */}
      <div>
        <h1 className="text-xl font-semibold">
          {link.title || link.shortCode}
        </h1>

        <a
          href={link.shortUrl}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline text-sm"
        >
          {link.shortUrl}
        </a>

        <p className="text-sm text-gray-500 mt-1 break-all">
          {link.originalUrl}
        </p>

        <p className="text-xs text-gray-400 mt-1 capitalize">
          Status: {link.state}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500">
            Total clicks
          </p>

          <p className="text-2xl font-semibold">
            {analytics?.totalClicks ?? 0}
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500">
            Last clicked
          </p>

          <p className="text-sm">
            {analytics?.lastClickedAt
              ? new Date(
                  analytics.lastClickedAt
                ).toLocaleString()
              : 'Never'}
          </p>
        </div>
      </div>

      {/* Analytics breakdown */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Breakdown
            title="Referrers"
            rows={analytics.referrers}
          />

          <Breakdown
            title="Devices"
            rows={analytics.devices}
          />

          <Breakdown
            title="Browsers"
            rows={analytics.browsers}
          />

          <Breakdown
            title="Operating Systems"
            rows={analytics.operatingSystems}
          />

          <Breakdown
            title="Countries"
            rows={analytics.countries}
          />
        </div>
      )}
    </div>
  );
}
