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

      setLinks((prev) => prev.filter((l) => l.id !== id));
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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold mb-4">
          Create a short link
        </h1>

        <form
          onSubmit={handleCreate}
          className="border rounded-lg p-4 space-y-3 max-w-xl"
        >
          {createError && (
            <p className="text-sm text-red-600">
              {createError}
            </p>
          )}

          <div>
            <label className="block text-sm mb-1">
              Destination URL
            </label>

            <input
              type="text"
              required
              placeholder="https://example.com/some/long/page"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm mb-1">
                Custom alias (optional)
              </label>

              <input
                type="text"
                placeholder="my-link"
                value={customAlias}
                onChange={(e) =>
                  setCustomAlias(e.target.value)
                }
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm mb-1">
                Title (optional)
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create link'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">
          My Links
        </h2>

        {loading && (
          <p className="text-sm text-gray-500">
            Loading...
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        {!loading && links.length === 0 && (
          <p className="text-sm text-gray-500">
            No links yet. Create your first one above.
          </p>
        )}

        {links.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2">
                    Short URL
                  </th>

                  <th className="px-3 py-2">
                    Destination
                  </th>

                  <th className="px-3 py-2">
                    Clicks
                  </th>

                  <th className="px-3 py-2">
                    Status
                  </th>

                  <th className="px-3 py-2"></th>
                </tr>
              </thead>

              <tbody>
                {links.map((link) => (
                  <tr
                    key={link.id}
                    className="border-t"
                  >
                    <td className="px-3 py-2">
                      <a
                        href={link.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        {link.shortUrl}
                      </a>
                    </td>

                    <td className="px-3 py-2 max-w-xs truncate text-gray-600">
                      <Link
                        href={`/dashboard/links/${link.id}`}
                        className="hover:underline"
                      >
                        {link.title || link.originalUrl}
                      </Link>
                    </td>

                    <td className="px-3 py-2">
                      {link.clickCount}
                    </td>

                    <td className="px-3 py-2 capitalize">
                      {link.state}
                    </td>

                    <td className="px-3 py-2 flex gap-2 justify-end">
                      <button
                        onClick={() =>
                          copyToClipboard(link.shortUrl)
                        }
                        className="text-xs border rounded px-2 py-1 hover:bg-gray-100"
                      >
                        Copy
                      </button>

                      <button
                        onClick={() =>
                          handleToggleStatus(link)
                        }
                        className="text-xs border rounded px-2 py-1 hover:bg-gray-100"
                      >
                        {link.state === 'disabled'
                          ? 'Enable'
                          : 'Disable'}
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(link.id)
                        }
                        className="text-xs border rounded px-2 py-1 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}