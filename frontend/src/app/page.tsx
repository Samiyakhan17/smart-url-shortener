import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8FAF6] text-[#171A17]">
      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#F8FAF6]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B2D959] text-xl font-bold shadow-sm">
              ↗
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">LinkSnap</h1>
              <p className="text-[11px] text-[#8FA28A]">
                Shorten · Track · Grow
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-[#7EC151]"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="transition-colors hover:text-[#7EC151]"
            >
              How it works
            </a>

            <a
              href="#analytics"
              className="transition-colors hover:text-[#7EC151]"
            >
              Analytics
            </a>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 sm:block"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-[#B2D959] px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#A7CF50] hover:shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        {/* Soft decorative circles */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#B2D959]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-80 h-80 w-80 rounded-full bg-[#7EC151]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#B2D959]/40 bg-[#B2D959]/10 px-4 py-2 text-sm font-medium text-[#5D763F]">
              <span className="h-2 w-2 rounded-full bg-[#7EC151]" />
              Simple links. Powerful analytics.
            </div>

            {/* Heading */}
            <h2 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Turn long URLs into
              <span className="block text-[#7EC151]">
                smart, trackable links.
              </span>
            </h2>

            {/* Description */}
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#68746A] sm:text-xl">
              Create short links, share them anywhere, and understand exactly
              how your audience interacts with every click.
            </p>

            {/* CTA */}
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="flex h-13 items-center justify-center rounded-xl bg-[#B2D959] px-7 py-3.5 font-semibold shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#A7CF50] hover:shadow-lg"
              >
                Create your first link
                <span className="ml-2 text-lg">→</span>
              </Link>

              <Link
                href="/login"
                className="flex h-13 items-center justify-center rounded-xl border border-black/10 bg-white px-7 py-3.5 font-semibold transition-all hover:border-[#7EC151]/40 hover:bg-[#F4F8EE]"
              >
                Sign in
              </Link>
            </div>

            <p className="mt-4 text-sm text-[#8FA28A]">
              No complicated setup · Start in seconds
            </p>
          </div>

          {/* ================= URL INPUT DEMO ================= */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-[0_20px_60px_rgba(50,70,40,0.08)]">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center rounded-xl bg-[#F5F7F3] px-5 py-4">
                  <span className="mr-3 text-lg text-[#8FA28A]">🔗</span>
                  <span className="truncate text-sm text-[#8FA28A]">
                    https://example.com/my-very-long-url
                  </span>
                </div>

                <Link
                  href="/register"
                  className="flex items-center justify-center rounded-xl bg-[#7EC151] px-7 py-4 text-sm font-semibold text-white transition-all hover:bg-[#70B344]"
                >
                  Shorten URL
                  <span className="ml-2">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Small trust row */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[#8FA28A]">
            <span>✓ Fast redirects</span>
            <span>✓ Click analytics</span>
            <span>✓ Link management</span>
            <span>✓ Secure authentication</span>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section
        id="features"
        className="border-y border-black/5 bg-white py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#7EC151]">
              Everything you need
            </p>

            <h3 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              More than just a URL shortener.
            </h3>

            <p className="mt-4 leading-7 text-[#68746A]">
              Manage your links and understand what happens after you share
              them.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-black/5 bg-[#F8FAF6] p-7 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B2D959]/25 text-2xl">
                🔗
              </div>

              <h4 className="mt-6 text-lg font-bold">Smart Short Links</h4>

              <p className="mt-3 text-sm leading-6 text-[#68746A]">
                Create clean, memorable URLs that are easy to share anywhere.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-black/5 bg-[#F8FAF6] p-7 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B2D959]/25 text-2xl">
                📊
              </div>

              <h4 className="mt-6 text-lg font-bold">Powerful Analytics</h4>

              <p className="mt-3 text-sm leading-6 text-[#68746A]">
                Track clicks, visitors, countries, and link performance.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-black/5 bg-[#F8FAF6] p-7 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B2D959]/25 text-2xl">
                ⚡
              </div>

              <h4 className="mt-6 text-lg font-bold">Fast Redirects</h4>

              <p className="mt-3 text-sm leading-6 text-[#68746A]">
                Keep your audience moving with quick and reliable redirects.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-black/5 bg-[#F8FAF6] p-7 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B2D959]/25 text-2xl">
                🔐
              </div>

              <h4 className="mt-6 text-lg font-bold">Secure & Organized</h4>

              <p className="mt-3 text-sm leading-6 text-[#68746A]">
                Keep your links organized with authentication and management
                tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ANALYTICS ================= */}
      <section id="analytics" className="bg-[#F8FAF6] py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:px-8">
          {/* Text */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#7EC151]">
              Understand your audience
            </p>

            <h3 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Every click tells a story.
            </h3>

            <p className="mt-6 max-w-xl leading-7 text-[#68746A]">
              See how your links perform with a clean analytics dashboard.
              Monitor clicks, visitors, locations, and activity without
              drowning in complicated reports.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B2D959] text-xs">
                  ✓
                </div>

                <div>
                  <p className="font-semibold">Track every click</p>
                  <p className="mt-1 text-sm text-[#8FA28A]">
                    Monitor link performance over time.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B2D959] text-xs">
                  ✓
                </div>

                <div>
                  <p className="font-semibold">Understand your audience</p>
                  <p className="mt-1 text-sm text-[#8FA28A]">
                    See where your visitors are coming from.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B2D959] text-xs">
                  ✓
                </div>

                <div>
                  <p className="font-semibold">Manage everything in one place</p>
                  <p className="mt-1 text-sm text-[#8FA28A]">
                    Keep your links organized from one dashboard.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/register"
              className="mt-9 inline-flex rounded-xl bg-[#7EC151] px-6 py-3.5 font-semibold text-white transition-all hover:bg-[#70B344]"
            >
              Start tracking your links →
            </Link>
          </div>

          {/* Dashboard preview */}
          <div className="relative">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_20px_60px_rgba(50,70,40,0.08)]">
              {/* Fake browser header */}
              <div className="flex items-center gap-2 border-b border-black/5 pb-4">
                <div className="h-2.5 w-2.5 rounded-full bg-[#B2D959]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#DCE8D3]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#EDF1EA]" />

                <div className="ml-4 h-7 flex-1 rounded-lg bg-[#F5F7F3]" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 py-5 sm:grid-cols-4">
                <StatCard title="Total Links" value="24" />
                <StatCard title="Clicks" value="1,248" />
                <StatCard title="Visitors" value="1,102" />
                <StatCard title="Active" value="21" />
              </div>

              {/* Chart */}
              <div className="rounded-xl border border-black/5 bg-[#F8FAF6] p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Link Clicks Overview</p>
                  <span className="rounded-lg bg-[#B2D959]/30 px-3 py-1 text-xs font-medium">
                    7D
                  </span>
                </div>

                <div className="mt-6 flex h-40 items-end gap-3">
                  {[35, 52, 43, 70, 55, 82, 100].map((height, index) => (
                    <div
                      key={index}
                      className="flex flex-1 items-end"
                    >
                      <div
                        className="w-full rounded-t-lg bg-[#B2D959]/70"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-5 -left-5 rounded-xl border border-black/5 bg-white px-5 py-4 shadow-lg">
              <p className="text-xs text-[#8FA28A]">Clicks this week</p>
              <p className="mt-1 text-xl font-bold">
                1,248{" "}
                <span className="text-sm font-semibold text-[#7EC151]">
                  +56%
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#7EC151]">
              Simple workflow
            </p>

            <h3 className="mt-3 text-3xl font-bold sm:text-4xl">
               Three steps. That&apos;s it.
            </h3>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <Step
              number="01"
              title="Create"
              description="Paste your long URL and create a short, shareable link in seconds."
            />

            <Step
              number="02"
              title="Share"
              description="Use your short link across social media, websites, messages, or anywhere else."
            />

            <Step
              number="03"
              title="Track"
              description="Open your dashboard and understand how people interact with your links."
            />
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[#EAF4D8] px-8 py-16 text-center sm:px-16">
          <div className="mx-auto max-w-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B2D959] text-2xl shadow-sm">
              ↗
            </div>

            <h3 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to make your links smarter?
            </h3>

            <p className="mt-4 leading-7 text-[#68746A]">
              Create your first short link and start tracking your audience
              today.
            </p>

            <Link
              href="/register"
              className="mt-8 inline-flex rounded-xl bg-[#7EC151] px-7 py-3.5 font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#70B344] hover:shadow-md"
            >
              Get Started for Free →
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-black/5 bg-[#F8FAF6]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-6 py-8 sm:flex-row lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#B2D959] text-sm font-bold">
              ↗
            </div>

            <div>
              <p className="text-sm font-bold">LinkSnap</p>
              <p className="text-xs text-[#8FA28A]">
                Shorten · Track · Grow
              </p>
            </div>
          </div>

          <p className="text-sm text-[#8FA28A]">
            © 2026 LinkSnap. Built with Next.js.
          </p>

          <div className="flex gap-5 text-sm text-[#68746A]">
            <Link href="/login" className="hover:text-[#7EC151]">
              Login
            </Link>

            <Link href="/register" className="hover:text-[#7EC151]">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ================= SMALL COMPONENTS ================= */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="text-xs text-[#8FA28A]">{title}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-2xl border border-black/5 bg-[#F8FAF6] p-8">
      <span className="text-sm font-bold text-[#7EC151]">{number}</span>

      <h4 className="mt-5 text-xl font-bold">{title}</h4>

      <p className="mt-3 text-sm leading-6 text-[#68746A]">
        {description}
      </p>
    </div>
  );
}