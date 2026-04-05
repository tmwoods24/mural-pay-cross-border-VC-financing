import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getMuralClient } from '@/lib/mural/index';
import { getServerClient } from '@/lib/supabase/client';
import type { Commitment, Deal, Investor } from '@/lib/supabase/types';
import type { Payin } from '@/lib/types';

const CreatePayinSchema = z.object({
  dealId: z.string().uuid(),
  investorName: z.string().min(1),
  investorEmail: z.string().email(),
  amountUsd: z.number().int().positive(),
  localCurrency: z.string().min(1),
  fxRateAtCommitment: z.number().positive(),
  localAmount: z.number().positive(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreatePayinSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    dealId,
    investorName,
    investorEmail,
    amountUsd,
    localCurrency,
    fxRateAtCommitment,
    localAmount,
  } = parsed.data;

  const db = getServerClient();

  // ── 1. Confirm deal exists and is open ──────────────────────────────────────
  const { data: deal, error: dealErr } = await db
    .from('deals')
    .select()
    .eq('id', dealId)
    .maybeSingle();

  if (dealErr) {
    return Response.json({ error: dealErr.message }, { status: 500 });
  }
  if (!deal) {
    return Response.json({ error: 'Deal not found' }, { status: 404 });
  }
  if ((deal as Deal).status !== 'open') {
    return Response.json(
      { error: `Deal is not open (current status: ${(deal as Deal).status})` },
      { status: 400 },
    );
  }

  // ── 2. Look up or create investor ────────────────────────────────────────────
  let investorId: string;
  {
    const { data: existing, error: lookupErr } = await db
      .from('investors')
      .select('id')
      .eq('email', investorEmail)
      .maybeSingle();

    if (lookupErr) {
      return Response.json({ error: lookupErr.message }, { status: 500 });
    }

    if (existing) {
      investorId = (existing as Pick<Investor, 'id'>).id;
    } else {
      const { data: created, error: createErr } = await db
        .from('investors')
        .insert({
          name: investorName,
          email: investorEmail,
          is_accredited: true,
          accreditation_attested_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createErr || !created) {
        return Response.json(
          { error: createErr?.message ?? 'Failed to create investor' },
          { status: 500 },
        );
      }
      investorId = (created as Pick<Investor, 'id'>).id;
    }
  }

  // ── 3. Create payin via Mural ─────────────────────────────────────────────
  let payin: Payin;
  try {
    payin = await getMuralClient().createPayin({
      amountUsd,
      currency: localCurrency,
      reference: 'DEAL-' + dealId.slice(0, 8).toUpperCase(),
      investorName,
      investorEmail,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mural error';
    return Response.json({ error: message }, { status: 500 });
  }

  // ── 4. Insert commitment ─────────────────────────────────────────────────────
  const { data: commitment, error: commitErr } = await db
    .from('commitments')
    .insert({
      deal_id: dealId,
      investor_id: investorId,
      amount_usd: amountUsd,
      fx_rate_at_commitment: fxRateAtCommitment,
      local_currency: localCurrency,
      local_amount: localAmount,
      mural_payin_id: payin.id,
      payin_status: 'pending',
    })
    .select('id')
    .single();

  if (commitErr || !commitment) {
    return Response.json(
      { error: commitErr?.message ?? 'Failed to create commitment' },
      { status: 500 },
    );
  }

  // ── 5. Update deal's committed amount ────────────────────────────────────────
  const currentCommitted = (deal as Deal).committed_amount_usd ?? 0;
  const { error: updateErr } = await db
    .from('deals')
    .update({ committed_amount_usd: currentCommitted + amountUsd })
    .eq('id', dealId);

  if (updateErr) {
    // Non-fatal — commitment is already recorded; log and continue
    console.error('Failed to update committed_amount_usd:', updateErr.message);
  }

  return Response.json(
    { payin, commitmentId: (commitment as Pick<Commitment, 'id'>).id },
    { status: 201 },
  );
}

export async function GET(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get('dealId');
  if (!dealId) {
    return Response.json({ error: 'dealId query param is required' }, { status: 400 });
  }

  const db = getServerClient();

  // Join commitments with investor name/email via a nested select
  const { data, error } = await db
    .from('commitments')
    .select(`
      id,
      created_at,
      deal_id,
      amount_usd,
      fx_rate_at_commitment,
      local_currency,
      local_amount,
      mural_payin_id,
      payin_status,
      investors (
        id,
        name,
        email
      )
    `)
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
