/**
 * Seed script — inserts realistic demo data into Supabase.
 * Run: npm run seed
 *
 * This script is destructive: it wipes all rows in every table before
 * re-inserting, so it is safe to run multiple times.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
    'Run: npx tsx --env-file=.env.local scripts/seed-demo-data.ts',
  );
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(url, key);

async function wipe() {
  // Delete in reverse dependency order to satisfy FK constraints
  for (const table of ['transactions', 'commitments', 'deals', 'investors', 'organizations']) {
    const { error } = await db.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(`Failed to wipe ${table}: ${error.message}`);
  }
  console.log('  ✓ wiped existing data');
}

async function seed() {
  console.log('\nSeeding demo data...\n');

  await wipe();

  // ── Organizations ────────────────────────────────────────────────────────

  const { data: orgs, error: orgErr } = await db
    .from('organizations')
    .insert([
      {
        legal_name: 'Kobo360',
        country: 'NG',
        founder_name: 'Obi Ozor',
        founder_email: 'obi@kobo360.com',
        raise_amount_usd: 25_000_000,   // $250,000 in cents
        use_of_funds: 'Fleet expansion and driver onboarding across West Africa',
        mural_org_id: 'mock-org-kobo360',
        kyc_status: 'verified',
        kyc_link: 'https://kyc.muralpay.com/mock/verify/mock-org-kobo360',
      },
      {
        legal_name: 'Pezesha',
        country: 'KE',
        founder_name: 'Hilda Moraa',
        founder_email: 'hilda@pezesha.com',
        raise_amount_usd: 50_000_000,   // $500,000 in cents
        use_of_funds: 'Embedded credit infrastructure for SME lenders in East Africa',
        mural_org_id: 'mock-org-pezesha',
        kyc_status: 'verified',
        kyc_link: 'https://kyc.muralpay.com/mock/verify/mock-org-pezesha',
      },
      {
        legal_name: 'Habi',
        country: 'CO',
        founder_name: 'Brynna Arnold',
        founder_email: 'brynna@habi.com.co',
        raise_amount_usd: 35_000_000,   // $350,000 in cents
        use_of_funds: 'Proptech marketplace growth and mortgage product launch in Colombia',
        mural_org_id: 'mock-org-habi',
        kyc_status: 'verified',
        kyc_link: 'https://kyc.muralpay.com/mock/verify/mock-org-habi',
      },
    ])
    .select('id, legal_name');

  if (orgErr || !orgs) throw new Error(`Failed to insert organizations: ${orgErr?.message}`);
  console.log(`  ✓ inserted ${orgs.length} organizations`);

  const kobo = orgs.find((o) => o.legal_name === 'Kobo360')!;
  const pezesha = orgs.find((o) => o.legal_name === 'Pezesha')!;
  const habi = orgs.find((o) => o.legal_name === 'Habi')!;

  // ── Deals ────────────────────────────────────────────────────────────────

  const { data: deals, error: dealErr } = await db
    .from('deals')
    .insert([
      {
        organization_id: kobo.id,
        target_amount_usd: 25_000_000,  // $250,000
        committed_amount_usd: 2_500_000, // Sarah's $25,000
        status: 'open',
        instrument: 'SAFE',
      },
      {
        organization_id: pezesha.id,
        target_amount_usd: 50_000_000,  // $500,000
        committed_amount_usd: 0,
        status: 'open',
        instrument: 'SAFE',
      },
      {
        organization_id: habi.id,
        target_amount_usd: 35_000_000,  // $350,000
        committed_amount_usd: 0,
        status: 'open',
        instrument: 'SAFE',
      },
    ])
    .select('id, organization_id');

  if (dealErr || !deals) throw new Error(`Failed to insert deals: ${dealErr?.message}`);
  console.log(`  ✓ inserted ${deals.length} deals`);

  const koboDeal = deals.find((d) => d.organization_id === kobo.id)!;

  // ── Investors ────────────────────────────────────────────────────────────

  const { data: investors, error: invErr } = await db
    .from('investors')
    .insert([
      {
        name: 'Sarah Chen',
        email: 'sarah@demoangel.com',
        is_accredited: true,
        accreditation_attested_at: new Date('2024-11-01T10:00:00Z').toISOString(),
      },
      {
        name: 'Marcus Williams',
        email: 'marcus@demoangel.com',
        is_accredited: true,
        accreditation_attested_at: new Date('2024-11-15T14:30:00Z').toISOString(),
      },
    ])
    .select('id, name');

  if (invErr || !investors) throw new Error(`Failed to insert investors: ${invErr?.message}`);
  console.log(`  ✓ inserted ${investors.length} investors`);

  const sarah = investors.find((i) => i.name === 'Sarah Chen')!;

  // ── Commitments ──────────────────────────────────────────────────────────

  const { data: commitments, error: comErr } = await db
    .from('commitments')
    .insert([
      {
        deal_id: koboDeal.id,
        investor_id: sarah.id,
        amount_usd: 2_500_000,          // $25,000 in cents
        fx_rate_at_commitment: 1580,
        local_currency: 'NGN',
        local_amount: 39_500_000,       // 25,000 × 1580
        mural_payin_id: 'mock-payin-seed-001',
        payin_status: 'completed',
      },
    ])
    .select('id');

  if (comErr || !commitments) throw new Error(`Failed to insert commitments: ${comErr?.message}`);
  console.log(`  ✓ inserted ${commitments.length} commitment`);

  // ── Summary ──────────────────────────────────────────────────────────────

  console.log(`
Demo data ready:
  Organizations : Kobo360 (NG), Pezesha (KE), Habi (CO) — all KYC verified
  Deals         : one open SAFE deal per org
  Investors     : Sarah Chen, Marcus Williams — both accredited
  Commitments   : Sarah → Kobo360 $25,000 (payin completed)
`);
}

seed().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
