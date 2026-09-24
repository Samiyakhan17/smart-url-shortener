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

  async function loadKeys() {
    try {
      const res = await api.get<{ data: ApiKeyItem[] }>('/keys');

      setKeys(res.data);
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

    if (!confirmed) {
      return;
    }

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold mb-1">
          API Keys
        </h1>

        <p className="text-sm text-gray-500 mb-4">
          Use an API key to create and manage links from your
          own scripts, without logging in.
        </p>

        {/* Newly created key */}
        {newKey && (
          <div className="border border-yellow-400 bg-yellow-50 rounded-lg p-4 mb-4 text-sm">
            <p className="font-semibold mb-1">
              Copy this key now — you won&apos;t see it again.
            </p>

            <code className="block bg-white border rounded px-2 py-2 break-all">
              {newKey}
            </code>

            <button
              type="button"
              onClick={() => setNewKey(null)}
              className="mt-2 text-xs underline text-gray-600 hover:text-gray-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Create API key */}
        <form
          onSubmit={handleCreate}
          className="border rounded-lg p-4 space-y-3 max-w-md"
        >
          {createError && (
            <p className="text-sm text-red-600">
              {createError}
            </p>
          )}

          <div>
            <label
              htmlFor="key-name"
              className="block text-sm mb-1"
            >
              Key name
            </label>

            <input
              id="key-name"
              type="text"
              required
              placeholder="My script"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
              className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create key'}
          </button>
        </form>
      </div>

      {/* Keys list */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Your keys
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

        {!loading && !error && keys.length === 0 && (
          <p className="text-sm text-gray-500">
            No API keys yet.
          </p>
        )}

        {keys.length > 0 && (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2">
                    Name
                  </th>

                  <th className="px-3 py-2">
                    Prefix
                  </th>

                  <th className="px-3 py-2">
                    Last used
                  </th>

                  <th className="px-3 py-2 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {keys.map((key) => (
                  <tr
                    key={key.id}
                    className="border-t"
                  >
                    <td className="px-3 py-2">
                      {key.name}
                    </td>

                    <td className="px-3 py-2 font-mono text-xs">
                      {key.prefix}...
                    </td>

                    <td className="px-3 py-2 text-gray-500">
                      {key.lastUsedAt
                        ? new Date(
                            key.lastUsedAt
                          ).toLocaleString()
                        : 'Never'}
                    </td>

                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          handleRevoke(key.id)
                        }
                        className="text-xs border rounded px-2 py-1 text-red-600 hover:bg-red-50"
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
      </div>
    </div>
  );
}