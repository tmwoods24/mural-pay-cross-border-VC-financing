import axios from 'axios';
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

// Axios instance kept here for when live integration is wired up
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _http = axios.create({
  baseURL: process.env.MURAL_PAY_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.MURAL_PAY_API_KEY}`,
  },
});

class NotImplementedError extends Error {
  constructor() {
    super('Live API not configured — set MURAL_USE_MOCK=false and provide MURAL_PAY_API_KEY');
    this.name = 'NotImplementedError';
  }
}

export async function createOrganization(_input: CreateOrganizationInput): Promise<Organization> {
  throw new NotImplementedError();
}

export async function getKycLink(_orgId: string): Promise<string> {
  throw new NotImplementedError();
}

export async function getOrganization(_orgId: string): Promise<Organization> {
  throw new NotImplementedError();
}

export async function getExchangeRate(_from: string, _to: string): Promise<ExchangeRate> {
  throw new NotImplementedError();
}

export async function createPayin(_input: CreatePayinInput): Promise<Payin> {
  throw new NotImplementedError();
}

export async function createCounterparty(_input: CreateCounterpartyInput): Promise<Counterparty> {
  throw new NotImplementedError();
}

export async function createPayoutRequest(_input: CreatePayoutRequestInput): Promise<PayoutRequest> {
  throw new NotImplementedError();
}

export async function executePayoutRequest(_payoutId: string): Promise<PayoutRequest> {
  throw new NotImplementedError();
}
