import { getServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  let supabase: 'connected' | 'error' = 'error';

  try {
    const db = getServerClient();
    const { error } = await db
      .from('organizations')
      .select('id', { count: 'exact', head: true });

    if (!error) supabase = 'connected';
  } catch {
    // supabase stays 'error'
  }

  return Response.json({
    status: 'ok',
    mock_mode: process.env.MURAL_USE_MOCK === 'true',
    supabase,
    timestamp: new Date().toISOString(),
  });
}
