'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';

type ApiKeyItem = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadKeys() {
    try {
      const res = await api.get<{ data: ApiKeyItem[] }>('/keys');

      setKeys(res.data);
      setError('');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to load API keys.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadKeys();
  }, []);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setCreateError('Please enter a key name.');
      return;
    }

    setCreateError('');
    setCreating(true);

    try {
      const res = await api.post<{
        data: {
          key: string;
          id: string;
          name: string;
          prefix: string;
          createdAt: string;
          expiresAt: string | null;
          lastUsedAt: string | null;
        };
      }>('/keys', {
        name: trimmedName,
      });

      setNewKey(res.data.key);
      setName('');

      await loadKeys();
    } catch (err) {
      setCreateError(
        err instanceof ApiError
          ? err.message
          : 'Failed to create key.'
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    const confirmed = window.confirm(
      'Revoke this API key? Any script using it will stop working.'
    );

    if (!confirmed) return;

    try {
      await api.delete(`/keys/${id}`);

      setKeys((prev) =>
        prev.filter((key) => key.id !== id)
      );
    } catch (err) {
      window.alert(
        err instanceof ApiError
          ? err.message
          : 'Failed to revoke key.'
      );
    }
  }

  async function copyKey() {
    if (!newKey) return;

    await navigator.clipboard.writeText(newKey);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  function formatDate(date: string | null) {
    if (!date) return 'Never';

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="min-h-full bg-[#F8FAF6] -m-6 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-[#B2D959] flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#263322"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="7.5" cy="15.5" r="5.5" />
                <path d="m21 2-9.6 9.6" />
                <path d="m15 7 3 3" />
                <path d="m18 4 2 2" />
              </svg>
            </div>

            <span className="text-xs font-semibold uppercase tracking-wider text-[#8FA28A]">
              Developer
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-[#263322]">
            API Keys
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-[#6D7B6B]">
            Create and manage API keys for your applications and
            automation scripts.
          </p>
        </div>

        {/* Create Key + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-6">

          {/* Create Card */}
          <div className="bg-white border border-[#E2E9DE] rounded-2xl p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[#263322]">
                Create a new API key
              </h2>

              <p className="text-sm text-[#7A8778] mt-1">
                Give your key a name so you can identify it later.
              </p>
            </div>

            {createError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {createError}
              </div>
            )}

            <form
              onSubmit={handleCreate}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                id="key-name"
                type="text"
                required
                placeholder="e.g. My website"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={creating}
                className="flex-1 rounded-xl border border-[#DCE5D8] bg-[#FAFCF8] px-4 py-3 text-sm text-[#263322] outline-none transition placeholder:text-[#A0AAA0] focus:border-[#7EC151] focus:ring-2 focus:ring-[#B2D959]/30 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={creating || !name.trim()}
                className="rounded-xl bg-[#7EC151] px-5 py-3 text-sm font-semibold text-[#1F2A1C] transition hover:bg-[#70B345] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create key'}
              </button>
            </form>
          </div>

          {/* Info Card */}
          <div className="rounded-2xl border border-[#DDE8D7] bg-[#EEF5E8] p-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-[#B2D959] flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#263322"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#263322]">
                  Keep your keys private
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#687566]">
                  API keys provide access to your account. Never
                  commit them to GitHub or expose them in frontend
                  code.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Newly Created Key */}
        {newKey && (
          <div className="rounded-2xl border border-[#D5E7B9] bg-[#F2F8E8] p-6">
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#7EC151]" />

                  <h2 className="text-sm font-semibold text-[#263322]">
                    API key created
                  </h2>
                </div>

                <p className="text-sm text-[#6D7B6B] mt-1">
                  Copy this key now. For security, it won&apos;t be
                  shown again.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <code className="flex-1 rounded-xl border border-[#DCE5D8] bg-white px-4 py-3 text-xs font-mono text-[#354331] break-all">
                  {newKey}
                </code>

                <button
                  type="button"
                  onClick={copyKey}
                  className="rounded-xl border border-[#C9D8C3] bg-white px-4 py-3 text-sm font-medium text-[#40523C] hover:bg-[#F8FAF6]"
                >
                  {copied ? 'Copied!' : 'Copy key'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setNewKey(null)}
                className="self-start text-xs font-medium text-[#71806D] hover:text-[#263322]"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Keys Section */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#263322]">
                Your API keys
              </h2>

              <p className="text-sm text-[#7A8778] mt-1">
                {keys.length === 0
                  ? 'No keys have been created yet.'
                  : `${keys.length} ${
                      keys.length === 1 ? 'key' : 'keys'
                    } available`}
              </p>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white border border-[#E2E9DE] rounded-2xl p-10 text-center">
              <div className="mx-auto w-8 h-8 rounded-full border-2 border-[#DCE7D8] border-t-[#7EC151] animate-spin" />

              <p className="mt-3 text-sm text-[#7A8778]">
                Loading your API keys...
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && keys.length === 0 && (
            <div className="bg-white border border-dashed border-[#CCD9C8] rounded-2xl p-12 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[#EEF5E8] flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#7EC151"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="7.5" cy="15.5" r="5.5" />
                  <path d="m21 2-9.6 9.6" />
                  <path d="m15 7 3 3" />
                  <path d="m18 4 2 2" />
                </svg>
              </div>

              <h3 className="mt-4 text-base font-semibold text-[#263322]">
                No API keys yet
              </h3>

              <p className="mt-1 text-sm text-[#7A8778]">
                Create your first key above to connect your
                applications.
              </p>
            </div>
          )}

          {/* Desktop Table */}
          {!loading && !error && keys.length > 0 && (
            <div className="hidden md:block overflow-hidden bg-white border border-[#E2E9DE] rounded-2xl shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-[#F5F8F3] border-b border-[#E2E9DE]">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#7A8778]">
                      Name
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#7A8778]">
                      Key
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#7A8778]">
                      Created
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#7A8778]">
                      Last used
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#7A8778]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {keys.map((key) => (
                    <tr
                      key={key.id}
                      className="border-b border-[#EEF2EC] last:border-0 hover:bg-[#FAFCF8] transition"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#EEF5E8] flex items-center justify-center text-sm font-semibold text-[#5D8749]">
                            {key.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <p className="font-medium text-[#263322]">
                              {key.name}
                            </p>

                            <p className="text-xs text-[#9AA598]">
                              API access key
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-lg bg-[#F1F5EF] px-3 py-1.5 font-mono text-xs text-[#536150]">
                          {key.prefix}...
                        </span>
                      </td>

                      <td className="px-5 py-4 text-[#687566]">
                        {formatDate(key.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-[#687566]">
                        {key.lastUsedAt
                          ? formatDate(key.lastUsedAt)
                          : 'Never'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRevoke(key.id)}
                          className="rounded-lg border border-[#E8CACA] px-3 py-1.5 text-xs font-medium text-[#B34F4F] transition hover:bg-[#FFF4F4]"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Cards */}
          {!loading && !error && keys.length > 0 && (
            <div className="md:hidden space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="bg-white border border-[#E2E9DE] rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EEF5E8] flex items-center justify-center font-semibold text-[#5D8749]">
                        {key.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <p className="font-medium text-[#263322]">
                          {key.name}
                        </p>

                        <span className="inline-flex mt-1 rounded-md bg-[#F1F5EF] px-2 py-1 font-mono text-[11px] text-[#536150]">
                          {key.prefix}...
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRevoke(key.id)}
                      className="rounded-lg border border-[#E8CACA] px-3 py-1.5 text-xs font-medium text-[#B34F4F]"
                    >
                      Revoke
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#EEF2EC] pt-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-[#9AA598]">
                        Created
                      </p>

                      <p className="mt-1 text-xs text-[#687566]">
                        {formatDate(key.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-[#9AA598]">
                        Last used
                      </p>

                      <p className="mt-1 text-xs text-[#687566]">
                        {key.lastUsedAt
                          ? formatDate(key.lastUsedAt)
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}