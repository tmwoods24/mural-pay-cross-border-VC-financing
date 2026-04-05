import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getMuralClient } from '@/lib/mural/index';
import { getServerClient } from '@/lib/supabase/client';
import type { Organization } from '@/lib/supabase/types';

const CreateOrgSchema = z.object({
  legalName: z.string().min(1),
  country: z.string().length(2),
  founderName: z.string().min(1),
  founderEmail: z.string().email(),
  raiseAmountUsd: z.number().int().positive(),
  useOfFunds: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreateOrgSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;

  try {
    const mural = getMuralClient();
    const muralOrg = await mural.createOrganization(input);

    const db = getServerClient();
    const { data, error } = await db
      .from('organizations')
      .insert({
        legal_name: input.legalName,
        country: input.country,
        founder_name: input.founderName,
        founder_email: input.founderEmail,
        raise_amount_usd: input.raiseAmountUsd,
        use_of_funds: input.useOfFunds,
        mural_org_id: muralOrg.muralOrgId,
        kyc_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json(data as Organization, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const muralOrgId = req.nextUrl.searchParams.get('muralOrgId');
  if (!muralOrgId) {
    return Response.json({ error: 'muralOrgId query param is required' }, { status: 400 });
  }

  const db = getServerClient();
  const { data, error } = await db
    .from('organizations')
    .select()
    .eq('mural_org_id', muralOrgId)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: 'Organization not found' }, { status: 404 });
  }

  return Response.json(data as Organization);
}
