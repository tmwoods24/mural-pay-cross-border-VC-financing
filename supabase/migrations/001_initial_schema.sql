-- 001_initial_schema.sql

create table organizations (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  legal_name        text        not null,
  country           text        not null,
  founder_name      text        not null,
  founder_email     text        not null,
  raise_amount_usd  integer     not null,  -- stored in cents
  use_of_funds      text,
  mural_org_id      text,
  kyc_status        text        not null default 'pending',
  kyc_link          text,
  clerk_user_id     text
);

create table investors (
  id                          uuid        primary key default gen_random_uuid(),
  created_at                  timestamptz not null default now(),
  name                        text        not null,
  email                       text        not null,
  clerk_user_id               text,
  is_accredited               boolean     not null default false,
  accreditation_attested_at   timestamptz
);

create table deals (
  id                    uuid        primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  organization_id       uuid        references organizations(id),
  target_amount_usd     integer     not null,
  committed_amount_usd  integer     not null default 0,
  status                text        not null default 'open',
  instrument            text        not null default 'SAFE'
);

create table commitments (
  id                    uuid        primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  deal_id               uuid        references deals(id),
  investor_id           uuid        references investors(id),
  amount_usd            integer     not null,
  fx_rate_at_commitment numeric,
  local_currency        text,
  local_amount          numeric,
  mural_payin_id        text,
  payin_status          text        not null default 'pending'
);

create table transactions (
  id               uuid        primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  organization_id  uuid        references organizations(id),
  commitment_id    uuid        references commitments(id),
  mural_payout_id  text,
  amount_usd       integer,
  local_currency   text,
  local_amount     numeric,
  status           text        not null default 'pending',
  counterparty_id  text
);

-- Foreign key indexes
create index on deals            (organization_id);
create index on commitments      (deal_id);
create index on commitments      (investor_id);
create index on transactions     (organization_id);
create index on transactions     (commitment_id);

-- Mural reference indexes
create index on organizations    (mural_org_id);
create index on commitments      (mural_payin_id);
create index on transactions     (mural_payout_id);
