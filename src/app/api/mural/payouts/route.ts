import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getMuralClient } from '@/lib/mural/index';
import { getServerClient } from '@/lib/supabase/client';
import type { Transaction } from '@/lib/supabase/types';

// ─── Country bank detail generators ──────────────────────────────────────────

function randomDigits(n: number) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
}

function bankDetailsForCountry(country: string): Record<string, string> {
  switch (country) {
    case 'NG':
      return {
        bankName: 'Guaranty Trust Bank',
        accountNumber: '0' + randomDigits(9),
        sortCode: '058152052',
      };
    case 'KE':
      return {
        bankName: 'Equity Bank Kenya',
        accountNumber: randomDigits(12),
        branchCode: '068',
      };
    case 'CO':
      return {
        bankName: 'Bancolombia',
        accountNumber: randomDigits(10),
        bankCode: '007',
      };
    default:
      return { bankName: 'Unknown', accountNumber: randomDigits(10) };
  }
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const CreatePayoutSchema = z.object({
  commitmentId: z.string().uuid(),
  organizationId: z.string().uuid(),
  muralOrgId: z.string().min(1),
  legalName: z.string().min(1),
  country: z.string().length(2),
  localCurrency: z.string().min(1),
  amountUsd: z.number().int().positive(),   // cents
  fxRate: z.number().positive(),
  localAmount: z.number().positive(),
});

// ─── GET — list disbursable commitments ──────────────────────────────────────

export async function GET() {
  const db = getServerClient();

  // Fetch completed payins with their deal, org, and investor
  const { data: commitments, error: commitErr } = await db
    .from('commitments')
    .select(`
      id,
      created_at,
      amount_usd,
      local_currency,
      local_amount,
      fx_rate_at_commitment,
      mural_payin_id,
      payin_status,
      investors ( id, name, email ),
      deals (
        id,
        organization_id,
        target_amount_usd,
        organizations ( legal_name, country, mural_org_id )
      )
    `)
    .eq('payin_status', 'completed');

  if (commitErr) {
    return Response.json({ error: commitErr.message }, { status: 500 });
  }

  // Fetch commitment_ids that already have a completed transaction
  const { data: doneTxns, error: txnErr } = await db
    .from('transactions')
    .select('commitment_id')
    .eq('status', 'completed');

  if (txnErr) {
    return Response.json({ error: txnErr.message }, { status: 500 });
  }

  const disbursedIds = new Set(
    (doneTxns ?? []).map((t: { commitment_id: string | null }) => t.commitment_id),
  );

  const disbursable = (commitments ?? []).filter(
    (c: { id: string }) => !disbursedIds.has(c.id),
  );

  return Response.json(disbursable);
}

// ─── POST — create + execute payout ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreatePayoutSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    commitmentId,
    organizationId,
    legalName,
    country,
    localCurrency,
    amountUsd,
    fxRate,
    localAmount,
  } = parsed.data;

  const mural = getMuralClient();
  const db = getServerClient();

  // ── Step 1: Create counterparty ───────────────────────────────────────────
  let counterparty: Awaited<ReturnType<typeof mural.createCounterparty>>;
  try {
    counterparty = await mural.createCounterparty({
      organizationId,
      name: legalName,
      country,
      currency: localCurrency,
      bankDetails: bankDetailsForCountry(country),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create counterparty';
    return Response.json({ error: message }, { status: 500 });
  }

  // ── Step 2: Create payout request ─────────────────────────────────────────
  let payoutRequest: Awaited<ReturnType<typeof mural.createPayoutRequest>>;
  try {
    payoutRequest = await mural.createPayoutRequest({
      counterpartyId: counterparty.id,
      amountUsd: amountUsd / 100,   // cents → dollars
      localCurrency,
      reference: 'PAYOUT-' + commitmentId.slice(0, 8).toUpperCase(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create payout request';
    return Response.json({ error: message }, { status: 500 });
  }

  // ── Step 3: Execute the payout (mock adds 2s delay) ───────────────────────
  let executedPayout: Awaited<ReturnType<typeof mural.executePayoutRequest>>;
  try {
    executedPayout = await mural.executePayoutRequest(payoutRequest.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to execute payout';
    return Response.json({ error: message }, { status: 500 });
  }

  // ── Step 4: Record transaction in Supabase ────────────────────────────────
  const { data: txn, error: txnErr } = await db
    .from('transactions')
    .insert({
      organization_id: organizationId,
      commitment_id: commitmentId,
      mural_payout_id: executedPayout.id,
      amount_usd: amountUsd,
      local_currency: localCurrency,
      local_amount: localAmount,
      status: 'completed',
      counterparty_id: counterparty.id,
    })
    .select()
    .single();

  if (txnErr || !txn) {
    return Response.json(
      { error: txnErr?.message ?? 'Failed to record transaction' },
      { status: 500 },
    );
  }

  // Also store the fx_rate context alongside for the admin view
  const result: Transaction & { fxRate: number } = {
    ...(txn as Transaction),
    fxRate,
  };

  return Response.json(result, { status: 201 });
}
