import { getServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRY_META: Record<string, { flag: string; name: string; currency: string }> = {
  NG: { flag: '🇳🇬', name: 'Nigeria', currency: 'NGN' },
  KE: { flag: '🇰🇪', name: 'Kenya', currency: 'KES' },
  CO: { flag: '🇨🇴', name: 'Colombia', currency: 'COP' },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type OrgSnapshot = {
  legal_name: string;
  country: string;
  use_of_funds: string | null;
  raise_amount_usd: number;
  kyc_status: string;
  mural_org_id: string | null;
};

type DealRow = {
  id: string;
  target_amount_usd: number;
  committed_amount_usd: number;
  instrument: string;
  organizations: OrgSnapshot | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fundingPct(committed: number, target: number) {
  if (target === 0) return 0;
  return Math.min(100, Math.round((committed / target) * 100));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DealCard({ deal }: { deal: DealRow }) {
  const org = deal.organizations!;
  const meta = COUNTRY_META[org.country] ?? { flag: '🌍', name: org.country, currency: 'USD' };
  const pct = fundingPct(deal.committed_amount_usd, deal.target_amount_usd);
  const commitUrl = [
    `/investor/commit?dealId=${deal.id}`,
    `currency=${meta.currency}`,
    `orgName=${encodeURIComponent(org.legal_name)}`,
    `targetAmount=${deal.target_amount_usd}`,
    `country=${org.country}`,
    `instrument=${encodeURIComponent(deal.instrument)}`,
  ].join('&');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Top row: name + instrument badge */}
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 leading-tight">
          {org.legal_name}
        </h2>
        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
          {deal.instrument}
        </span>
      </div>

      {/* Country */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <span>{meta.flag}</span>
        <span>{meta.name}</span>
        <span className="text-gray-300">·</span>
        <span className="font-medium text-gray-700">{meta.currency}</span>
      </div>

      {/* Use of funds */}
      {org.use_of_funds && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
          {org.use_of_funds}
        </p>
      )}

      {/* Raise target */}
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-gray-500">Raise target</span>
        <span className="text-base font-semibold text-gray-900">
          {formatUsd(deal.target_amount_usd)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{formatUsd(deal.committed_amount_usd)} committed</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-2 rounded-full bg-indigo-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <a
        href={commitUrl}
        className="mt-auto block w-full text-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
      >
        Invest Now
      </a>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-900">No open deals</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-xs">
        There are no verified deals available right now. Check back soon or{' '}
        <a href="/startup/onboard" className="text-indigo-600 hover:underline">
          list your own startup
        </a>.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InvestorDealsPage() {
  const db = getServerClient();

  const { data, error } = await db
    .from('deals')
    .select(`
      id,
      target_amount_usd,
      committed_amount_usd,
      instrument,
      organizations (
        legal_name,
        country,
        use_of_funds,
        raise_amount_usd,
        kyc_status,
        mural_org_id
      )
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) {
    // In a production app this would be an error boundary; for now surface clearly
    throw new Error(`Failed to fetch deals: ${error.message}`);
  }

  // Filter client-side for verified orgs (avoids PostgREST join-filter edge cases)
  const deals = ((data ?? []) as unknown as DealRow[]).filter(
    (d) => d.organizations?.kyc_status === 'verified',
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-800">Borderless Raise</span>
          </div>
          <a
            href="/startup/onboard"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            List your startup →
          </a>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Open Deals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Accredited investors only · Reg D 506(b)
          </p>
        </div>

        {/* Deal grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.length === 0 ? (
            <EmptyState />
          ) : (
            deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
          )}
        </div>
      </main>
    </div>
  );
}
