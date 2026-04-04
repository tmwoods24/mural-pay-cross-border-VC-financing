// Row types — what you get back from SELECT queries

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

// Supabase Database shape for use with createClient<Database>.
//
// Rules imposed by GenericTable / GenericSchema in @supabase/postgrest-js:
//  - Every table entry must have Row, Insert, Update, AND Relationships.
//  - The schema must have Tables, Views, and Functions.
//  - Insert/Update types use `string` for enum columns (Postgres text columns)
//    so they remain assignable without narrowing.
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Relationships: [];
        Insert: {
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
        };
        Update: {
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
        };
      };
      investors: {
        Row: Investor;
        Relationships: [];
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          email: string;
          clerk_user_id?: string | null;
          is_accredited?: boolean;
          accreditation_attested_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          email?: string;
          clerk_user_id?: string | null;
          is_accredited?: boolean;
          accreditation_attested_at?: string | null;
        };
      };
      deals: {
        Row: Deal;
        Relationships: [];
        Insert: {
          id?: string;
          created_at?: string;
          organization_id?: string | null;
          target_amount_usd: number;
          committed_amount_usd?: number;
          status?: string;
          instrument?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          organization_id?: string | null;
          target_amount_usd?: number;
          committed_amount_usd?: number;
          status?: string;
          instrument?: string;
        };
      };
      commitments: {
        Row: Commitment;
        Relationships: [];
        Insert: {
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
        };
        Update: {
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
        };
      };
      transactions: {
        Row: Transaction;
        Relationships: [];
        Insert: {
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
        };
        Update: {
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
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
