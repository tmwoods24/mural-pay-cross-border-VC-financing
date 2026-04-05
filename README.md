# Cross-Border Capital Platform

A prototype platform enabling US-based accredited investors to fund emerging-market startups with seamless cross-border capital disbursement — built on [Mural Pay's](https://muralpay.com) API infrastructure.

---

## What This Is

Early-stage startups in Nigeria, Kenya, and Colombia face a structural problem: closing a verbal commitment from a US angel investor is the easy part. Actually receiving the capital — in local currency, reliably, without a US bank account — is where deals die.

This platform solves the infrastructure layer. US accredited investors can browse vetted startups, see a live FX rate at the moment of commitment, and send capital that arrives in the startup's local currency within 48 hours. No wire confusion. No FX guesswork. No US banking requirement for the founder.

The platform is scoped to Reg D 506(b) — accredited investors only — to minimize regulatory complexity while remaining a credible, real-world product.

---

## The Three Core Flows

**1. Startup KYC Onboarding**
Founders register their company and are routed through Mural Pay's hosted compliance and identity verification flow. Once verified, their deal is listed on the platform.

**2. Investor Capital Commitment**
Accredited investors browse open deals, see a live USD → local currency exchange rate pulled from the Mural Pay API, complete an accredited investor attestation, and submit a capital commitment. Payment instructions are returned immediately.

**3. Capital Disbursement**
Once a payin is confirmed, the platform creates a counterparty record for the startup and executes a cross-border payout in local currency via Mural Pay's payout rails.

---

## Target Markets

| Market | Currency | Rationale |
|--------|----------|-----------|
| Nigeria | NGN | Largest Anglophone startup ecosystem in Africa. Deep YC/accelerator alumni network. |
| Kenya | KES | East Africa's leading tech hub. Most mature fintech infrastructure in the region. |
| Colombia | COP | Leading LatAm market with strong bilateral ties to US investors. |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) |
| Auth | Clerk |
| Payments | Mural Pay API |
| Deployment | Vercel |

---

## Architecture Note

The platform uses a dual-client pattern for the Mural Pay integration:

```
src/lib/mural/
  client.ts        ← Real Mural Pay API client (Bearer auth)
  client.mock.ts   ← Mock client with realistic delays + FX variance
  index.ts         ← getMuralClient() — switches on MURAL_USE_MOCK
```

Setting `MURAL_USE_MOCK=true` runs the full product with simulated API responses — realistic exchange rates with live variance, proper status progressions, and authentic delay timing. Setting it to `false` and providing a real API key switches to live Mural Pay infrastructure with no other code changes.

---

## Getting Started

**1. Clone the repo**

```bash
git clone https://github.com/YOURUSERNAME/cross-border-capital.git
cd cross-border-capital
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.local.example .env.local
```

Fill in your credentials in `.env.local` — see the Environment Variables section below.

**4. Run the database migration**

In your Supabase project, open the SQL editor and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

**5. Seed demo data**

```bash
npx ts-node scripts/seed-demo-data.ts
```

This populates three verified startups (Kobo360, Pezesha, Habi), two accredited demo investors, and one existing commitment so the platform has a lived-in feel from the first screen.

**6. Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**7. Confirm everything is running**

```
GET http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "ok",
  "mock_mode": true,
  "supabase": "connected",
  "timestamp": "..."
}
```

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values below.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `MURAL_PAY_API_KEY` | Live only | Mural Pay Bearer token (not required in mock mode) |
| `MURAL_PAY_BASE_URL` | Yes | `https://api-staging.muralpay.com` for sandbox |
| `MURAL_USE_MOCK` | Yes | `true` for mock mode, `false` for live API |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` in development |

---

## Project Structure

```
src/
  app/
    startup/
      onboard/          ← Startup KYC onboarding flow
    investor/
      deals/            ← Deal listing with live FX rates
      commit/           ← Capital commitment + attestation
    admin/              ← Disbursement control panel
    api/
      mural/            ← Server-side Mural Pay API routes
      health/           ← Health check endpoint
  lib/
    mural/              ← API client (real + mock)
    supabase/           ← DB client + TypeScript types
    types.ts            ← Shared type definitions
  components/
    ui/                 ← Shared UI components
supabase/
  migrations/           ← SQL schema
scripts/
  seed-demo-data.ts     ← Demo data seeding
```

---

## Regulatory Scope

This prototype operates within **Regulation D, Rule 506(b)** — capital raises from accredited investors with no general solicitation. Accredited investor status is self-certified via attestation at the point of commitment. Any production deployment would require securities counsel review, third-party accredited investor verification, and a FinCEN/MSB compliance assessment.

---

## Roadmap

**v1 — Infrastructure (current)**
Three live API flows. Reg D 506(b) accredited investor attestation. Nigeria, Kenya, Colombia.

**v2 — Deal Layer**
SAFE and convertible note generation + e-signature. Investor pro-rata tracking. Startup dashboard with transaction history.

**v3 — Network**
Accelerator white-label partnerships. Any regional accelerator program adopts the platform as standard post-program funding infrastructure.

---

## License

MIT