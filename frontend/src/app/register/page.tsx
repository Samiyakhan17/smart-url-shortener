'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, ApiError } from '@/lib/auth-context';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      await register(name, email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Something went wrong.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: '#F8FAF6' }}
    >
      <div className="w-full max-w-5xl grid lg:grid-cols-2 overflow-hidden rounded-3xl bg-white shadow-[0_25px_70px_rgba(126,193,81,0.18)] border border-[#B2D959]/30">

        {/* LEFT BRANDING SECTION */}
        <div
          className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
          style={{
            background:
              'linear-gradient(145deg, #7EC151 0%, #B2D959 100%)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/20" />
          <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-white/15" />

          {/* Logo */}
          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                <span
                  className="text-xl font-black"
                  style={{ color: '#7EC151' }}
                >
                  L
                </span>
              </div>

              <span className="text-2xl font-bold tracking-tight">
                LinkSnap
              </span>
            </Link>
          </div>

          {/* Main message */}
          <div className="relative z-10 max-w-md">
            <div className="mb-5 inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              ✦ Smart URL Management
            </div>

            <h2 className="text-4xl font-bold leading-tight text-white">
              Short links.
              <br />
              Simple control.
            </h2>

            <p className="mt-5 text-base leading-7 text-white/90">
              Create, manage, and track your short links with a clean
              and developer-friendly URL platform.
            </p>

            {/* Small feature cards */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">01</p>
                <p className="mt-1 text-sm text-white/85">
                  Create instantly
                </p>
              </div>

              <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">02</p>
                <p className="mt-1 text-sm text-white/85">
                  Track your links
                </p>
              </div>
            </div>
          </div>

          {/* Bottom text */}
          <p className="relative z-10 text-sm text-white/80">
            Fast. Simple. Developer-friendly.
          </p>
        </div>

        {/* RIGHT REGISTER SECTION */}
        <div className="flex items-center justify-center p-7 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="mb-8 lg:hidden">
              <Link
                href="/"
                className="inline-flex items-center gap-2"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: '#7EC151' }}
                >
                  <span className="text-xl font-black text-white">L</span>
                </div>

                <span
                  className="text-2xl font-bold"
                  style={{ color: '#7EC151' }}
                >
                  LinkSnap
                </span>
              </Link>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <div
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: '#B2D959' }}
              >
                <span className="text-xl">✦</span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#263026]">
                Create your account
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#8FA28A]">
                Join LinkSnap and start managing your short links.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-[#263026]"
                >
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-[#8FA28A]/35 bg-[#F8FAF6] px-4 py-3.5 text-sm text-[#263026] outline-none transition placeholder:text-[#8FA28A]/70 focus:border-[#7EC151] focus:bg-white focus:ring-4 focus:ring-[#B2D959]/25"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#263026]"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#8FA28A]/35 bg-[#F8FAF6] px-4 py-3.5 text-sm text-[#263026] outline-none transition placeholder:text-[#8FA28A]/70 focus:border-[#7EC151] focus:bg-white focus:ring-4 focus:ring-[#B2D959]/25"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-[#263026]"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full rounded-xl border border-[#8FA28A]/35 bg-[#F8FAF6] px-4 py-3.5 text-sm text-[#263026] outline-none transition placeholder:text-[#8FA28A]/70 focus:border-[#7EC151] focus:bg-white focus:ring-4 focus:ring-[#B2D959]/25"
                />
              </div>

              {/* Create Account button */}
              <button
                type="submit"
                disabled={busy}
                className="group w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                style={{
                  background:
                    'linear-gradient(135deg, #7EC151 0%, #B2D959 100%)',
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  {busy ? 'Creating account...' : 'Create Account'}

                  {!busy && (
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  )}
                </span>
              </button>
            </form>

            {/* Login */}
            <div className="mt-7 text-center">
              <p className="text-sm text-[#8FA28A]">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-[#7EC151] transition hover:text-[#8FA28A]"
                >
                  Log in
                </Link>
              </p>
            </div>

            {/* Bottom accent */}
            <div className="mt-8 flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7EC151]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#B2D959]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#8FA28A]" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}