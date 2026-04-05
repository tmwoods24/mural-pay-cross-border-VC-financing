'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RateData {
  rate: number;
  fromCurrency: string;
  toCurrency: string;
  timestamp: string;
}

interface PayinResponse {
  payin: {
    id: string;
    amountUsd: number;
    status: string;
    paymentInstructions: {
      bankName: string;
      accountNumber: string;
      routingNumber: string;
      reference: string;
    };
  };
  commitmentId: string;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
              ${i + 1 < current ? 'bg-indigo-600 text-white' : ''}
              ${i + 1 === current ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : ''}
              ${i + 1 > current ? 'bg-gray-100 text-gray-400' : ''}
            `}
          >
            {i + 1 < current ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (i + 1)}
          </div>
          {i < total - 1 && (
            <div className={`h-px w-8 ${i + 1 < current ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-sm text-gray-400">Step {current} of {total}</span>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatLocal(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount) + ' ' + currency;
}

const COUNTRY_NAMES: Record<string, string> = { NG: 'Nigeria', KE: 'Kenya', CO: 'Colombia' };
const COUNTRY_FLAGS: Record<string, string> = { NG: '🇳🇬', KE: '🇰🇪', CO: '🇨🇴' };

// ─── Step 1: Deal summary + live FX ──────────────────────────────────────────

function Step1({
  dealId,
  currency,
  orgName,
  targetAmount,
  country,
  instrument,
  onContinue,
}: {
  dealId: string;
  currency: string;
  orgName: string;
  targetAmount: number;
  country: string;
  instrument: string;
  onContinue: (amountUsd: number, rate: RateData) => void;
}) {
  const [rate, setRate] = useState<RateData | null>(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [rateError, setRateError] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRate = useCallback(async () => {
    try {
      const res = await fetch(`/api/mural/exchange-rates?to=${currency}`);
      if (!res.ok) throw new Error('Failed to fetch rate');
      const data: RateData = await res.json();
      setRate(data);
      setRateError(null);
    } catch {
      setRateError('Could not load exchange rate. Retrying...');
    } finally {
      setRateLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    fetchRate();
    intervalRef.current = setInterval(fetchRate, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchRate]);

  const amountDollars = parseFloat(amountInput) || 0;
  const localEquiv = rate ? amountDollars * rate.rate : null;

  const canContinue = amountDollars > 0 && rate !== null;

  function handleContinue() {
    if (!rate || amountDollars <= 0) return;
    onContinue(Math.round(amountDollars * 100), rate);
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

  return (
    <div className="space-y-6">
      {/* Deal summary */}
      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-gray-500">Company</span>
          <span className="text-sm font-semibold text-gray-900">{orgName}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-gray-500">Country</span>
          <span className="text-sm font-medium text-gray-900">
            {COUNTRY_FLAGS[country] ?? ''} {COUNTRY_NAMES[country] ?? country}
          </span>
        </div>
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-gray-500">Raise target</span>
          <span className="text-sm font-medium text-gray-900">{formatUsd(targetAmount)}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-gray-500">Instrument</span>
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            {instrument}
          </span>
        </div>
      </div>

      {/* Live rate widget */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Live Exchange Rate</span>
          {!rateLoading && !rateError && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Live
            </span>
          )}
        </div>

        {rateLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Spinner className="w-3.5 h-3.5 text-gray-400" />
            Fetching rate...
          </div>
        ) : rateError ? (
          <p className="text-sm text-red-500">{rateError}</p>
        ) : rate ? (
          <>
            <p className="text-lg font-semibold text-gray-900">
              1 USD = {rate.rate.toLocaleString('en-US', { maximumFractionDigits: 2 })} {currency}
            </p>
            <p className="text-xs text-gray-400">
              Last updated: {new Date(rate.timestamp).toLocaleTimeString()}
            </p>
          </>
        ) : null}
      </div>

      {/* Amount input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Investment Amount (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="number"
            min="1"
            placeholder="25000"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className={`${inputCls} pl-7`}
          />
        </div>
        {localEquiv !== null && amountDollars > 0 && rate && (
          <p className="mt-2 text-sm text-indigo-600 font-medium">
            ≈ {formatLocal(localEquiv, currency)}
          </p>
        )}
      </div>

      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Continue
      </button>

      {/* Small print */}
      <p className="text-xs text-gray-400 text-center">
        Deal ID: {dealId.slice(0, 8).toUpperCase()}
      </p>
    </div>
  );
}

// ─── Step 2: Investor details + attestation ───────────────────────────────────

function Step2({
  amountUsd,
  rate,
  currency,
  orgName,
  onSuccess,
  onBack,
}: {
  amountUsd: number;
  rate: RateData;
  currency: string;
  orgName: string;
  dealId: string;
  onSuccess: (payin: PayinResponse, name: string, email: string) => void;
  onBack: () => void;
}) {
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId') ?? '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim() && email.trim() && check1 && check2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    const localAmount = (amountUsd / 100) * rate.rate;

    try {
      const res = await fetch('/api/mural/payins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          investorName: name.trim(),
          investorEmail: email.trim(),
          amountUsd,
          localCurrency: currency,
          fxRateAtCommitment: rate.rate,
          localAmount: Math.round(localAmount * 100) / 100,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.formErrors?.[0] ?? json.error ?? 'Something went wrong.');
        return;
      }

      onSuccess(json as PayinResponse, name.trim(), email.trim());
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Commitment summary */}
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-indigo-500 font-medium">Committing to {orgName}</p>
          <p className="text-lg font-bold text-indigo-700 mt-0.5">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountUsd / 100)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-indigo-400">≈ local equivalent</p>
          <p className="text-sm font-semibold text-indigo-600">
            {formatLocal((amountUsd / 100) * rate.rate, currency)}
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          required
          placeholder="Jane Investor"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input
          type="email"
          required
          placeholder="jane@fund.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </div>

      {/* Attestation checkboxes */}
      <div className="space-y-3 pt-1">
        {[
          {
            id: 'check1',
            checked: check1,
            onChange: () => setCheck1((v) => !v),
            label:
              'I confirm that I am an accredited investor as defined by SEC Rule 501(a). I understand this is a Regulation D 506(b) offering and is not registered with the SEC.',
          },
          {
            id: 'check2',
            checked: check2,
            onChange: () => setCheck2((v) => !v),
            label:
              'I understand that this investment is illiquid and I may not be able to sell or transfer my interest.',
          },
        ].map(({ id, checked, onChange, label }) => (
          <label key={id} className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <span className="text-sm text-gray-600 leading-relaxed">{label}</span>
          </label>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner className="w-4 h-4 text-white" />
            Processing commitment...
          </span>
        ) : (
          'Confirm Commitment'
        )}
      </button>

      {/* Legal disclaimer */}
      <p className="text-xs text-gray-400 text-center leading-relaxed">
        This offering is made pursuant to Regulation D, Rule 506(b) under the Securities
        Act of 1933. This is not a public offering.
      </p>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition"
      >
        ← Back
      </button>
    </form>
  );
}

// ─── Step 3: Confirmation + wire instructions ─────────────────────────────────

function Step3({
  payin,
  amountUsd,
  rate,
  currency,
  orgName,
  investorName,
}: {
  payin: PayinResponse;
  amountUsd: number;
  rate: RateData;
  currency: string;
  orgName: string;
  investorName: string;
}) {
  const instructions = payin.payin.paymentInstructions;
  const localAmount = (amountUsd / 100) * rate.rate;

  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="text-center py-2">
        <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Commitment confirmed</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Welcome aboard, {investorName.split(' ')[0]}.
        </p>
      </div>

      {/* Commitment summary */}
      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {[
          { label: 'Company', value: orgName },
          {
            label: 'Amount',
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountUsd / 100),
          },
          {
            label: 'Local equivalent',
            value: `${formatLocal(localAmount, currency)} (at ${rate.rate.toFixed(2)})`,
          },
          { label: 'Instrument', value: 'SAFE' },
          { label: 'Reference', value: instructions.reference },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
          </div>
        ))}
      </div>

      {/* Payment instructions */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="text-sm font-semibold text-blue-900">Wire Transfer Instructions</span>
        </div>

        {[
          { label: 'Bank', value: instructions.bankName },
          { label: 'Account', value: instructions.accountNumber },
          { label: 'Routing', value: instructions.routingNumber },
          { label: 'Reference', value: instructions.reference, highlight: true },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-sm text-blue-600">{label}</span>
            <span className={`text-sm font-mono ${highlight ? 'font-bold text-blue-900' : 'text-blue-800'}`}>
              {value}
            </span>
          </div>
        ))}

        <p className="text-xs text-blue-600 pt-2 border-t border-blue-200 leading-relaxed">
          Wire these funds within 48 hours to complete your investment.
          Include the reference number in your transfer.
        </p>
      </div>

      <a
        href="/investor/deals"
        className="block w-full text-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
      >
        View all deals
      </a>
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

const STEP_META = [
  { heading: 'Review deal', sub: 'Check the terms and current exchange rate.' },
  { heading: 'Confirm commitment', sub: 'Provide your details and attest eligibility.' },
  { heading: 'Wire instructions', sub: 'Transfer funds to complete your investment.' },
];

function CommitPageInner() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId') ?? '';
  const currency = searchParams.get('currency') ?? 'USD';
  const orgName = searchParams.get('orgName') ?? 'Unknown company';
  const targetAmount = parseInt(searchParams.get('targetAmount') ?? '0', 10);
  const country = searchParams.get('country') ?? '';
  const instrument = searchParams.get('instrument') ?? 'SAFE';

  const [step, setStep] = useState(1);
  const [amountUsd, setAmountUsd] = useState(0);
  const [rate, setRate] = useState<RateData | null>(null);
  const [payin, setPayin] = useState<PayinResponse | null>(null);
  const [investorName, setInvestorName] = useState('');

  if (!dealId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No deal selected.</p>
          <a href="/investor/deals" className="text-indigo-600 text-sm hover:underline mt-2 block">
            Browse deals
          </a>
        </div>
      </div>
    );
  }

  const meta = STEP_META[step - 1];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white shadow-sm rounded-2xl w-full max-w-lg p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">Borderless Raise</span>
          </div>
          <StepIndicator current={step} total={3} />
          <h1 className="text-xl font-semibold text-gray-900">{meta.heading}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.sub}</p>
        </div>

        <div className="border-t border-gray-100 pt-6">
          {step === 1 && (
            <Step1
              dealId={dealId}
              currency={currency}
              orgName={orgName}
              targetAmount={targetAmount}
              country={country}
              instrument={instrument}
              onContinue={(amt, r) => {
                setAmountUsd(amt);
                setRate(r);
                setStep(2);
              }}
            />
          )}

          {step === 2 && rate && (
            <Step2
              amountUsd={amountUsd}
              rate={rate}
              currency={currency}
              orgName={orgName}
              dealId={dealId}
              onSuccess={(p, name) => {
                setPayin(p);
                setInvestorName(name);
                setStep(3);
              }}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && payin && rate && (
            <Step3
              payin={payin}
              amountUsd={amountUsd}
              rate={rate}
              currency={currency}
              orgName={orgName}
              investorName={investorName}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvestorCommitPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Spinner className="w-6 h-6 text-indigo-600" />
        </div>
      }
    >
      <CommitPageInner />
    </Suspense>
  );
}
