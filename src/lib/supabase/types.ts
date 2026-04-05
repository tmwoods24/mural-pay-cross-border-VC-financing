// ─── Row types ───────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  created_at: string;
  legal_name: string;
  country: string;
  founder_name: string;
  founder_email: string;
  raise_amount_usd: number; // cents
  use_of_funds: string | null;
  mural_org_id: string | null;
  kyc_status: 'pending' | 'in_review' | 'verified' | 'rejected';
  kyc_link: string | null;
  clerk_user_id: string | null;
}

export interface Investor {
  id: string;
  created_at: string;
  name: string;
  email: string;
  clerk_user_id: string | null;
  is_accredited: boolean;
  accreditation_attested_at: string | null;
}

export interface Deal {
  id: string;
  created_at: string;
  organization_id: string | null;
  target_amount_usd: number;
  committed_amount_usd: number;
  status: 'open' | 'closed' | 'cancelled';
  instrument: string;
}

export interface Commitment {
  id: string;
  created_at: string;
  deal_id: string | null;
  investor_id: string | null;
  amount_usd: number;
  fx_rate_at_commitment: number | null;
  local_currency: string | null;
  local_amount: number | null;
  mural_payin_id: string | null;
  payin_status: 'pending' | 'completed' | 'failed';
}

export interface Transaction {
  id: string;
  created_at: string;
  organization_id: string | null;
  commitment_id: string | null;
  mural_payout_id: string | null;
  amount_usd: number | null;
  local_currency: string | null;
  local_amount: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  counterparty_id: string | null;
}

// ─── Insert types ─────────────────────────────────────────────────────────────
// All declared as `interface` (not inline type literals) so that TypeScript 5.x
// considers them to satisfy the `Record<string, unknown>` constraint required by
// @supabase/postgrest-js GenericTable. Inline type literals fail this check;
// named interface declarations pass it.

export interface OrganizationInsert {
  id?: string;
  created_at?: string;
  legal_name: string;
  country: string;
  founder_name: string;
  founder_email: string;
  raise_amount_usd: number;
  use_of_funds?: string | null;
  mural_org_id?: string | null;
  kyc_status?: string;
  kyc_link?: string | null;
  clerk_user_id?: string | null;
}

export interface InvestorInsert {
  id?: string;
  created_at?: string;
  name: string;
  email: string;
  clerk_user_id?: string | null;
  is_accredited?: boolean;
  accreditation_attested_at?: string | null;
}

export interface DealInsert {
  id?: string;
  created_at?: string;
  organization_id?: string | null;
  target_amount_usd: number;
  committed_amount_usd?: number;
  status?: string;
  instrument?: string;
}

export interface CommitmentInsert {
  id?: string;
  created_at?: string;
  deal_id?: string | null;
  investor_id?: string | null;
  amount_usd: number;
  fx_rate_at_commitment?: number | null;
  local_currency?: string | null;
  local_amount?: number | null;
  mural_payin_id?: string | null;
  payin_status?: string;
}

export interface TransactionInsert {
  id?: string;
  created_at?: string;
  organization_id?: string | null;
  commitment_id?: string | null;
  mural_payout_id?: string | null;
  amount_usd?: number | null;
  local_currency?: string | null;
  local_amount?: number | null;
  status?: string;
  counterparty_id?: string | null;
}

// ─── Update types ─────────────────────────────────────────────────────────────

export interface OrganizationUpdate {
  id?: string;
  created_at?: string;
  legal_name?: string;
  country?: string;
  founder_name?: string;
  founder_email?: string;
  raise_amount_usd?: number;
  use_of_funds?: string | null;
  mural_org_id?: string | null;
  kyc_status?: string;
  kyc_link?: string | null;
  clerk_user_id?: string | null;
}

export interface InvestorUpdate {
  id?: string;
  created_at?: string;
  name?: string;
  email?: string;
  clerk_user_id?: string | null;
  is_accredited?: boolean;
  accreditation_attested_at?: string | null;
}

export interface DealUpdate {
  id?: string;
  created_at?: string;
  organization_id?: string | null;
  target_amount_usd?: number;
  committed_amount_usd?: number;
  status?: string;
  instrument?: string;
}

export interface CommitmentUpdate {
  id?: string;
  created_at?: string;
  deal_id?: string | null;
  investor_id?: string | null;
  amount_usd?: number;
  fx_rate_at_commitment?: number | null;
  local_currency?: string | null;
  local_amount?: number | null;
  mural_payin_id?: string | null;
  payin_status?: string;
}

export interface TransactionUpdate {
  id?: string;
  created_at?: string;
  organization_id?: string | null;
  commitment_id?: string | null;
  mural_payout_id?: string | null;
  amount_usd?: number | null;
  local_currency?: string | null;
  local_amount?: number | null;
  status?: string;
  counterparty_id?: string | null;
}

// ─── Database shape for createClient<Database> ───────────────────────────────
//
// Every layer that Supabase's type machinery checks against an index-signature
// type (Record<string, T>) must be a named `interface`, not an inline type
// literal. The three levels are:
//   Database['public']          → must satisfy GenericSchema
//   Database['public']['Tables'] → must satisfy Record<string, GenericTable>
//   Each table entry            → must satisfy GenericTable
// Declaring each level as a named interface causes TypeScript to treat it as
// satisfying the corresponding Record<string, *> constraint.

export interface DbTables {
  organizations: {
    Row: Organization;
    Insert: OrganizationInsert;
    Update: OrganizationUpdate;
    Relationships: [];
  };
  investors: {
    Row: Investor;
    Insert: InvestorInsert;
    Update: InvestorUpdate;
    Relationships: [];
  };
  deals: {
    Row: Deal;
    Insert: DealInsert;
    Update: DealUpdate;
    Relationships: [];
  };
  commitments: {
    Row: Commitment;
    Insert: CommitmentInsert;
    Update: CommitmentUpdate;
    Relationships: [];
  };
  transactions: {
    Row: Transaction;
    Insert: TransactionInsert;
    Update: TransactionUpdate;
    Relationships: [];
  };
}

export interface PublicSchema {
  Tables: DbTables;
  Views: Record<string, never>;
  Functions: Record<string, never>;
}

export interface Database {
  public: PublicSchema;
}
