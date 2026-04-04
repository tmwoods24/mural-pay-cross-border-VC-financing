import type {
  Organization,
  ExchangeRate,
  Payin,
  Counterparty,
  PayoutRequest,
  CreateOrganizationInput,
  CreatePayinInput,
  CreateCounterpartyInput,
  CreatePayoutRequestInput,
} from '../types';

function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function networkDelay(): Promise<void> {
  return delay(800 + Math.random() * 700);
}

// Tracks how many times getOrganization has been called per org id
const orgCallCount = new Map<string, number>();

// In-memory store so executePayoutRequest can return correct payout data
const payoutStore = new Map<string, PayoutRequest>();

const BASE_RATES: Record<string, number> = {
  NGN: 1580,
  KES: 129,
  COP: 3950,
};

function withVariance(base: number): number {
  const delta = base * 0.005 * (Math.random() * 2 - 1);
  return Math.round((base + delta) * 100) / 100;
}

export async function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
  await networkDelay();
  return {
    id: uid(),
    legalName: input.legalName,
    country: input.country,
    founderName: input.founderName,
    founderEmail: input.founderEmail,
    raiseAmountUsd: input.raiseAmountUsd,
    useOfFunds: input.useOfFunds,
    muralOrgId: 'mock-org-' + uid(),
    kycStatus: 'pending',
    kycLink: '',
    createdAt: new Date().toISOString(),
  };
}

export async function getKycLink(orgId: string): Promise<string> {
  await networkDelay();
  return `https://kyc.muralpay.com/mock/verify/${orgId}`;
}

export async function getOrganization(orgId: string): Promise<Organization> {
  await networkDelay();
  const count = (orgCallCount.get(orgId) ?? 0) + 1;
  orgCallCount.set(orgId, count);

  const kycStatus: Organization['kycStatus'] =
    count === 1 ? 'pending' : count === 2 ? 'in_review' : 'verified';

  return {
    id: orgId,
    legalName: 'Mock Startup Inc.',
    country: 'NG',
    founderName: 'Jane Founder',
    founderEmail: 'jane@mockstartup.com',
    raiseAmountUsd: 500_000,
    useOfFunds: 'Product development and market expansion',
    muralOrgId: 'mock-org-' + orgId,
    kycStatus,
    kycLink: `https://kyc.muralpay.com/mock/verify/${orgId}`,
    createdAt: new Date().toISOString(),
  };
}

export async function getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
  await networkDelay();
  const base = BASE_RATES[to];
  if (!base) {
    throw new Error(`Unsupported currency pair: ${from} → ${to}`);
  }
  return {
    fromCurrency: from,
    toCurrency: to,
    rate: withVariance(base),
    timestamp: new Date().toISOString(),
  };
}

export async function createPayin(input: CreatePayinInput): Promise<Payin> {
  await networkDelay();
  const accountNumber = String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000));
  return {
    id: 'mock-payin-' + uid(),
    amountUsd: input.amountUsd,
    status: 'pending',
    paymentInstructions: {
      bankName: 'Chase Bank',
      accountNumber,
      routingNumber: '021000021',
      reference: input.reference,
    },
    createdAt: new Date().toISOString(),
  };
}

export async function createCounterparty(input: CreateCounterpartyInput): Promise<Counterparty> {
  await networkDelay();
  return {
    id: 'mock-cp-' + uid(),
    name: input.name,
    country: input.country,
    currency: input.currency,
    bankDetails: input.bankDetails,
    createdAt: new Date().toISOString(),
  };
}

export async function createPayoutRequest(input: CreatePayoutRequestInput): Promise<PayoutRequest> {
  await networkDelay();
  const base = BASE_RATES[input.localCurrency] ?? 1;
  const fxRate = withVariance(base);
  const payout: PayoutRequest = {
    id: 'mock-payout-' + uid(),
    amountUsd: input.amountUsd,
    localCurrency: input.localCurrency,
    localAmount: Math.round(input.amountUsd * fxRate * 100) / 100,
    fxRate,
    status: 'pending',
    counterpartyId: input.counterpartyId,
    createdAt: new Date().toISOString(),
  };
  payoutStore.set(payout.id, payout);
  return payout;
}

export async function executePayoutRequest(payoutId: string): Promise<PayoutRequest> {
  await delay(2000);
  const existing = payoutStore.get(payoutId);
  const payout: PayoutRequest = existing
    ? { ...existing, status: 'completed' }
    : {
        id: payoutId,
        amountUsd: 0,
        localCurrency: 'USD',
        localAmount: 0,
        fxRate: 1,
        status: 'completed',
        counterpartyId: '',
        createdAt: new Date().toISOString(),
      };
  payoutStore.set(payoutId, payout);
  return payout;
}
