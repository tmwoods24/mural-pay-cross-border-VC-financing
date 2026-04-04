export interface Organization {
  id: string;
  legalName: string;
  country: string;
  founderName: string;
  founderEmail: string;
  raiseAmountUsd: number;
  useOfFunds: string;
  muralOrgId: string;
  kycStatus: 'pending' | 'in_review' | 'verified' | 'rejected';
  kycLink: string;
  createdAt: string;
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: string;
}

export interface Payin {
  id: string;
  amountUsd: number;
  status: 'pending' | 'completed' | 'failed';
  paymentInstructions: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    reference: string;
  };
  createdAt: string;
}

export interface Counterparty {
  id: string;
  name: string;
  country: string;
  currency: string;
  bankDetails: Record<string, unknown>;
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  amountUsd: number;
  localCurrency: string;
  localAmount: number;
  fxRate: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  counterpartyId: string;
  createdAt: string;
}

export interface CreateOrganizationInput {
  legalName: string;
  country: string;
  founderName: string;
  founderEmail: string;
  raiseAmountUsd: number;
  useOfFunds: string;
}

export interface CreatePayinInput {
  amountUsd: number;
  currency: string;
  reference: string;
  investorName: string;
  investorEmail: string;
}

export interface CreateCounterpartyInput {
  organizationId: string;
  name: string;
  country: string;
  currency: string;
  bankDetails: Record<string, unknown>;
}

export interface CreatePayoutRequestInput {
  counterpartyId: string;
  amountUsd: number;
  localCurrency: string;
  reference: string;
}
