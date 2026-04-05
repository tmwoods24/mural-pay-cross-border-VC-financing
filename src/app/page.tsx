export default function HomePage() {
  return (
    <div className="flex flex-col flex-1 bg-white">

      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-28 bg-white">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 text-xs font-medium text-indigo-600 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          Powered by Mural Pay · Reg D 506(b)
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight max-w-2xl tracking-tight">
          Cross-border capital for the world&apos;s best startups
        </h1>
        <p className="mt-5 text-lg text-gray-500 max-w-xl leading-relaxed">
          US investors. Global founders. Capital that actually arrives —
          in local currency, within 48 hours.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-9">
          <a
            href="/startup/onboard"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
          >
            I&apos;m a Startup
          </a>
          <a
            href="/investor/deals"
            className="rounded-lg border border-indigo-600 px-6 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
          >
            I&apos;m an Investor
          </a>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="border-t border-gray-100" />

      {/* ── How it works ── */}
      <section className="px-6 py-20 max-w-5xl mx-auto w-full">
        <h2 className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-12">
          How it works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Startup onboards',
              description:
                'Register your company, complete KYC verification via Mural Pay, and list your deal for accredited investors.',
              icon: (
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
              ),
            },
            {
              step: '02',
              title: 'Investor commits',
              description:
                'Browse verified deals, see live FX rates, sign the accredited investor attestation, and commit capital.',
              icon: (
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              step: '03',
              title: 'Capital arrives',
              description:
                'Funds are disbursed in local currency — NGN, KES, or COP — directly to the startup\'s account within 48 hours.',
              icon: (
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
          ].map(({ step, title, description, icon }) => (
            <div key={step} className="flex flex-col items-start gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100">
                {icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-400 mb-1">Step {step}</p>
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-gray-100 px-6 py-6">
        <p className="text-center text-xs text-gray-400">
          Built on Mural Pay infrastructure · Reg D 506(b) · Accredited investors only
        </p>
      </footer>

    </div>
  );
}
