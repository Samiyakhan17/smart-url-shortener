'use client';

import { useEffect, useState, FormEvent } from 'react';
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

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadLinks() {
    setLoading(true);

    try {
      const res = await api.get<{ data: LinkItem[] }>('/urls?limit=50');
      setLinks(res.data);
      setError('');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load links.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchLinks() {
      try {
        const res = await api.get<{ data: LinkItem[] }>('/urls?limit=50');

        if (!cancelled) {
          setLinks(res.data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Failed to load links.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchLinks();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();

    setCreateError('');
    setCreating(true);

    try {
      const body: Record<string, string> = {
        originalUrl,
      };

      if (customAlias.trim()) {
        body.customAlias = customAlias.trim();
      }

      if (title.trim()) {
        body.title = title.trim();
      }

      await api.post('/urls', body);

      setOriginalUrl('');
      setCustomAlias('');
      setTitle('');

      await loadLinks();
    } catch (err) {
      setCreateError(
        err instanceof ApiError
          ? err.message
          : 'Failed to create link.'
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this link?')) return;

    try {
      await api.delete(`/urls/${id}`);
      setLinks((prev) => prev.filter((link) => link.id !== id));
    } catch (err) {
      alert(
        err instanceof ApiError
          ? err.message
          : 'Failed to delete link.'
      );
    }
  }

  async function handleToggleStatus(link: LinkItem) {
    const newStatus =
      link.state === 'disabled' ? 'active' : 'disabled';

    try {
      await api.patch(`/urls/${link.id}`, {
        status: newStatus,
      });

      await loadLinks();
    } catch (err) {
      alert(
        err instanceof ApiError
          ? err.message
          : 'Failed to update link.'
      );
    }
  }

  async function copyToClipboard(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);

      setCopiedId(id);

      setTimeout(() => {
        setCopiedId(null);
      }, 1500);
    } catch {
      alert('Failed to copy link.');
    }
  }

  const filteredLinks = links.filter((link) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      link.shortUrl.toLowerCase().includes(query) ||
      link.originalUrl.toLowerCase().includes(query) ||
      (link.title || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#F8FAF6]">
      {/* Header */}
      <header className="border-b border-black/5 bg-white">
        <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <div>
            <p className="text-sm text-[#8FA28A]">
              Workspace
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              My Links
            </h1>

            <p className="mt-1 text-sm text-[#8FA28A]">
              Create and manage your short links.
            </p>
          </div>

          <a
            href="#create-link"
            className="inline-flex w-fit items-center rounded-xl bg-[#7EC151] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#70B344] hover:shadow-md"
          >
            + Create Link
          </a>
        </div>
      </header>

      <main className="px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">

          {/* Create Link */}
          <section
            id="create-link"
            className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mx-auto max-w-3xl">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF4D8] text-xl">
                  🔗
                </div>

                <h2 className="mt-4 text-xl font-bold">
                  Create a short link
                </h2>

                <p className="mt-2 text-sm text-[#8FA28A]">
                  Paste your long URL and create a clean,
                  shareable link.
                </p>
              </div>

              <form
                onSubmit={handleCreate}
                className="mt-7 space-y-4"
              >
                {createError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {createError}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Destination URL
                  </label>

                  <input
                    type="url"
                    required
                    placeholder="https://example.com/your-long-url"
                    value={originalUrl}
                    onChange={(e) =>
                      setOriginalUrl(e.target.value)
                    }
                    className="w-full rounded-xl border border-black/10 bg-[#FAFBF8] px-4 py-3 text-sm outline-none transition placeholder:text-[#A8B2A9] focus:border-[#7EC151] focus:ring-2 focus:ring-[#B2D959]/20"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Custom alias
                      <span className="ml-1 text-xs text-[#8FA28A]">
                        optional
                      </span>
                    </label>

                    <input
                      type="text"
                      placeholder="my-link"
                      value={customAlias}
                      onChange={(e) =>
                        setCustomAlias(e.target.value)
                      }
                      className="w-full rounded-xl border border-black/10 bg-[#FAFBF8] px-4 py-3 text-sm outline-none transition placeholder:text-[#A8B2A9] focus:border-[#7EC151] focus:ring-2 focus:ring-[#B2D959]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Title
                      <span className="ml-1 text-xs text-[#8FA28A]">
                        optional
                      </span>
                    </label>

                    <input
                      type="text"
                      placeholder="My portfolio"
                      value={title}
                      onChange={(e) =>
                        setTitle(e.target.value)
                      }
                      className="w-full rounded-xl border border-black/10 bg-[#FAFBF8] px-4 py-3 text-sm outline-none transition placeholder:text-[#A8B2A9] focus:border-[#7EC151] focus:ring-2 focus:ring-[#B2D959]/20"
                    />
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-xl bg-[#7EC151] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#70B344] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating
                      ? 'Creating...'
                      : 'Create Short Link →'}
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Links */}
          <section className="mt-8 rounded-2xl border border-black/5 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-black/5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  Your Links
                </h2>

                <p className="mt-1 text-sm text-[#8FA28A]">
                  {links.length === 0
                    ? 'Your created links will appear here.'
                    : `${links.length} link${links.length === 1 ? '' : 's'} created`}
                </p>
              </div>

              {links.length > 0 && (
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8FA28A]">
                    ⌕
                  </span>

                  <input
                    type="search"
                    placeholder="Search links..."
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    className="w-full rounded-xl border border-black/10 bg-[#FAFBF8] py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-[#7EC151] sm:w-64"
                  />
                </div>
              )}
            </div>

            {loading && (
              <div className="p-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#B2D959] border-t-[#7EC151]" />

                <p className="mt-4 text-sm text-[#8FA28A]">
                  Loading your links...
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {!loading && !error && links.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF4D8] text-2xl">
                  🔗
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  No links yet
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#8FA28A]">
                  You haven&apos;t created any short links yet.
                  Create your first one above to get started.
                </p>
              </div>
            )}

            {!loading &&
              !error &&
              links.length > 0 &&
              filteredLinks.length === 0 && (
                <div className="px-6 py-14 text-center">
                  <p className="font-semibold">
                    No matching links
                  </p>

                  <p className="mt-1 text-sm text-[#8FA28A]">
                    Try searching for a different URL or title.
                  </p>
                </div>
              )}

            {!loading &&
              !error &&
              filteredLinks.length > 0 && (
                <>
                  {/* Desktop */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wider text-[#8FA28A]">
                          <th className="px-6 py-4 font-semibold">
                            Short Link
                          </th>

                          <th className="px-6 py-4 font-semibold">
                            Destination
                          </th>

                          <th className="px-6 py-4 font-semibold">
                            Clicks
                          </th>

                          <th className="px-6 py-4 font-semibold">
                            Status
                          </th>

                          <th className="px-6 py-4 text-right font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredLinks.map((link) => (
                          <tr
                            key={link.id}
                            className="border-b border-black/5 last:border-0 transition hover:bg-[#FAFBF8]"
                          >
                            <td className="px-6 py-5">
                              <a
                                href={link.shortUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-[#5D763F] hover:text-[#7EC151]"
                              >
                                {link.shortUrl}
                              </a>

                              {link.title && (
                                <p className="mt-1 text-xs text-[#8FA28A]">
                                  {link.title}
                                </p>
                              )}
                            </td>

                            <td className="max-w-xs px-6 py-5">
                              <Link
                                href={`/dashboard/links/${link.id}`}
                                className="block truncate text-sm text-[#68746A] hover:text-[#7EC151]"
                              >
                                {link.originalUrl}
                              </Link>
                            </td>

                            <td className="px-6 py-5">
                              <span className="text-sm font-semibold">
                                {link.clickCount}
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                  link.state === 'disabled'
                                    ? 'bg-gray-100 text-gray-500'
                                    : 'bg-[#B2D959]/20 text-[#5D763F]'
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    link.state === 'disabled'
                                      ? 'bg-gray-400'
                                      : 'bg-[#7EC151]'
                                  }`}
                                />

                                {link.state === 'disabled'
                                  ? 'Disabled'
                                  : 'Active'}
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      link.id,
                                      link.shortUrl
                                    )
                                  }
                                  className="rounded-lg border border-black/10 px-3 py-2 text-xs font-medium transition hover:bg-[#F5F7F3]"
                                >
                                  {copiedId === link.id
                                    ? 'Copied!'
                                    : 'Copy'}
                                </button>

                                <button
                                  onClick={() =>
                                    handleToggleStatus(link)
                                  }
                                  className="rounded-lg border border-black/10 px-3 py-2 text-xs font-medium transition hover:bg-[#F5F7F3]"
                                >
                                  {link.state === 'disabled'
                                    ? 'Enable'
                                    : 'Disable'}
                                </button>

                                <button
                                  onClick={() =>
                                    handleDelete(link.id)
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="divide-y divide-black/5 md:hidden">
                    {filteredLinks.map((link) => (
                      <div
                        key={link.id}
                        className="p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <a
                              href={link.shortUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-[#5D763F]"
                            >
                              {link.shortUrl}
                            </a>

                            <p className="mt-1 truncate text-xs text-[#8FA28A]">
                              {link.originalUrl}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                              link.state === 'disabled'
                                ? 'bg-gray-100 text-gray-500'
                                : 'bg-[#B2D959]/20 text-[#5D763F]'
                            }`}
                          >
                            {link.state === 'disabled'
                              ? 'Disabled'
                              : 'Active'}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {link.clickCount} clicks
                          </span>

                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  link.id,
                                  link.shortUrl
                                )
                              }
                              className="rounded-lg border border-black/10 px-3 py-2 text-xs font-medium"
                            >
                              {copiedId === link.id
                                ? 'Copied!'
                                : 'Copy'}
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(link.id)
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
          </section>
        </div>
      </main>
    </div>
  );
}