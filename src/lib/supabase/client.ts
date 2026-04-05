import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Server-side client — uses the service role key, bypasses RLS.
 * Only import this in API routes / server components (never shipped to the browser).
 *
 * Returns an untyped client; callers cast query results to the typed interfaces
 * from ./types (e.g. `data as Organization`). This sidesteps a TypeScript 5.x /
 * supabase-js 2.101 incompatibility where the Database generic resolves to never
 * due to changes in how the postgrest-js GenericSchema constraint is checked.
 */
export function getServerClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

/**
 * Browser-safe client — uses the anon key, respects RLS.
 * Safe to import in client components.
 */
export function getBrowserClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
