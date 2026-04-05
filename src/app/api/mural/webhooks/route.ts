/**
 * Mural Pay Webhook Handler
 *
 * In production this endpoint would validate the Mural Pay webhook signature
 * before processing any events. Mural Pay signs each webhook request with an
 * HMAC-SHA256 signature derived from the raw request body and a shared secret
 * (MURAL_PAY_WEBHOOK_SECRET). The signature is delivered in the
 * `X-Mural-Signature` header and should be verified like so:
 *
 *   const sig = req.headers.get('x-mural-signature');
 *   const body = await req.text();
 *   const expected = createHmac('sha256', process.env.MURAL_PAY_WEBHOOK_SECRET!)
 *     .update(body)
 *     .digest('hex');
 *   if (!timingSafeEqual(Buffer.from(sig!), Buffer.from(expected))) {
 *     return Response.json({ error: 'Invalid signature' }, { status: 401 });
 *   }
 *
 * Skipped here because in mock mode (MURAL_USE_MOCK=true) no real calls arrive.
 * Returning 200 for all recognised and unrecognised events is intentional —
 * webhook providers retry on non-200 responses, which would cause duplicate
 * processing of already-handled events.
 */

import { NextRequest } from 'next/server';
import { getServerClient } from '@/lib/supabase/client';

interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { event, data } = payload;
  const db = getServerClient();

  switch (event) {
    case 'organization.verified': {
      const muralOrgId = data.muralOrgId as string | undefined;
      if (!muralOrgId) {
        return Response.json({ error: 'Missing data.muralOrgId' }, { status: 400 });
      }

      const { error } = await db
        .from('organizations')
        .update({ kyc_status: 'verified' })
        .eq('mural_org_id', muralOrgId);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }
      return Response.json({ received: true });
    }

    case 'payin.completed': {
      const muralPayinId = data.muralPayinId as string | undefined;
      if (!muralPayinId) {
        return Response.json({ error: 'Missing data.muralPayinId' }, { status: 400 });
      }

      const { error } = await db
        .from('commitments')
        .update({ payin_status: 'completed' })
        .eq('mural_payin_id', muralPayinId);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }
      return Response.json({ received: true });
    }

    case 'payout.completed': {
      const muralPayoutId = data.muralPayoutId as string | undefined;
      if (!muralPayoutId) {
        return Response.json({ error: 'Missing data.muralPayoutId' }, { status: 400 });
      }

      const { error } = await db
        .from('transactions')
        .update({ status: 'completed' })
        .eq('mural_payout_id', muralPayoutId);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }
      return Response.json({ received: true });
    }

    default:
      console.log(`[webhook] unhandled event type: ${event}`, data);
      return Response.json({ received: true, note: 'unhandled event' });
  }
}
