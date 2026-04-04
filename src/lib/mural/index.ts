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

export interface MuralClient {
  createOrganization(input: CreateOrganizationInput): Promise<Organization>;
  getKycLink(orgId: string): Promise<string>;
  getOrganization(orgId: string): Promise<Organization>;
  getExchangeRate(from: string, to: string): Promise<ExchangeRate>;
  createPayin(input: CreatePayinInput): Promise<Payin>;
  createCounterparty(input: CreateCounterpartyInput): Promise<Counterparty>;
  createPayoutRequest(input: CreatePayoutRequestInput): Promise<PayoutRequest>;
  executePayoutRequest(payoutId: string): Promise<PayoutRequest>;
}

import * as mockClient from './client.mock';
import * as realClient from './client';

export function getMuralClient(): MuralClient {
  if (process.env.MURAL_USE_MOCK === 'true') {
    return mockClient;
  }
  return realClient;
}
