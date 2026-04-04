import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Server-side client — uses the service role key, bypasses RLS.
 * Only import this in API routes / server components (never shipped to the browser).
 */
export function getServerClient() {
  return createClient<Database>(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

/**
 * Browser-safe client — uses the anon key, respects RLS.
 * Safe to import in client components.
 */
export function getBrowserClient() {
  return createClient<Database>(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
