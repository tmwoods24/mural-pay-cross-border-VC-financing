import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getMuralClient } from '@/lib/mural/index';
import { getServerClient } from '@/lib/supabase/client';

const PostBodySchema = z.object({
  muralOrgId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { muralOrgId } = parsed.data;

  try {
    const kycUrl = await getMuralClient().getKycLink(muralOrgId);

    const db = getServerClient();
    const { error } = await db
      .from('organizations')
      .update({ kyc_link: kycUrl, kyc_status: 'pending' })
      .eq('mural_org_id', muralOrgId);

    if (error) throw error;

    return Response.json({ kycUrl });
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

  try {
    const muralOrg = await getMuralClient().getOrganization(muralOrgId);

    const db = getServerClient();
    const { data, error } = await db
      .from('organizations')
      .update({ kyc_status: muralOrg.kycStatus })
      .eq('mural_org_id', muralOrgId)
      .select('kyc_status, kyc_link')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return Response.json({ error: 'Organization not found' }, { status: 404 });
    }

    return Response.json({
      kycStatus: data.kyc_status,
      kycLink: data.kyc_link,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
}
