'use client';

import { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type KycStatus = 'pending' | 'in_review' | 'verified' | 'rejected';

interface FormData {
  legalName: string;
  country: string;
  founderName: string;
  founderEmail: string;
  raiseAmountUsd: string; // string while editing, converted on submit
  useOfFunds: string;
}

interface OrgResult {
  id: string;
  legal_name: string;
  country: string;
  mural_org_id: string;
  raise_amount_usd: number;
  kyc_status: KycStatus;
}

const COUNTRY_LABELS: Record<string, string> = {
  NG: 'Nigeria',
  KE: 'Kenya',
  CO: 'Colombia',
};

function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
            ) : (
              i + 1
            )}
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
    <svg
      className={`animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Step 1: Registration form ────────────────────────────────────────────────

function Step1Form({
  onSuccess,
}: {
  onSuccess: (org: OrgResult) => void;
}) {
  const [form, setForm] = useState<FormData>({
    legalName: '',
    country: 'NG',
    founderName: '',
    founderEmail: '',
    raiseAmountUsd: '',
    useOfFunds: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const dollars = parseFloat(form.raiseAmountUsd);
    if (isNaN(dollars) || dollars <= 0) {
      setError('Please enter a valid raise amount.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/mural/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalName: form.legalName,
          country: form.country,
          founderName: form.founderName,
          founderEmail: form.founderEmail,
          raiseAmountUsd: Math.round(dollars * 100),
          useOfFunds: form.useOfFunds,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.formErrors?.[0] ?? json.error ?? 'Something went wrong.');
        return;
      }

      onSuccess(json as OrgResult);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelCls}>Company Legal Name</label>
        <input
          type="text"
          required
          placeholder="e.g. Kobo360 Ltd."
          value={form.legalName}
          onChange={(e) => set('legalName', e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Country</label>
        <select
          value={form.country}
          onChange={(e) => set('country', e.target.value)}
          className={inputCls}
        >
          <option value="NG">Nigeria</option>
          <option value="KE">Kenya</option>
          <option value="CO">Colombia</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Founder Full Name</label>
          <input
            type="text"
            required
            placeholder="Jane Founder"
            value={form.founderName}
            onChange={(e) => set('founderName', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Founder Email</label>
          <input
            type="email"
            required
            placeholder="jane@company.com"
            value={form.founderEmail}
            onChange={(e) => set('founderEmail', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Raise Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="number"
            required
            min="1"
            placeholder="250000"
            value={form.raiseAmountUsd}
            onChange={(e) => set('raiseAmountUsd', e.target.value)}
            className={`${inputCls} pl-7`}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Use of Funds</label>
        <textarea
          required
          rows={3}
          placeholder="Describe how you'll deploy the capital..."
          value={form.useOfFunds}
          onChange={(e) => set('useOfFunds', e.target.value)}
          className={`${inputCls} resize-none`}
        />
      </div>

      {error && <ErrorBanner message={error} />}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner className="w-4 h-4 text-white" />
            Creating organization...
          </span>
        ) : (
          'Create Organization'
        )}
      </button>
    </form>
  );
}

// ─── Step 2: KYC verification ─────────────────────────────────────────────────

function Step2Kyc({
  org,
  onVerified,
}: {
  org: OrgResult;
  onVerified: (kycStatus: KycStatus) => void;
}) {
  const [kycStarted, setKycStarted] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function pollStatus() {
    try {
      const res = await fetch(
        `/api/mural/kyc?muralOrgId=${encodeURIComponent(org.mural_org_id)}`,
      );
      if (!res.ok) return;
      const json = await res.json();
      const status: KycStatus = json.kycStatus;
      setKycStatus(status);

      if (status === 'verified') {
        stopPolling();
        // Brief pause so the user sees "Verified" before advancing
        setTimeout(() => onVerified(status), 1200);
      } else if (status === 'rejected') {
        stopPolling();
      }
    } catch {
      // swallow polling errors — the interval will retry
    }
  }

  async function handleBeginVerification() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/mural/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muralOrgId: org.mural_org_id }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Failed to initiate KYC.');
        return;
      }

      // Open the KYC link in a new tab
      if (json.kycUrl) {
        window.open(json.kycUrl, '_blank', 'noopener,noreferrer');
      }

      setKycStarted(true);

      // Start polling immediately
      pollRef.current = setInterval(pollStatus, 3000);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  const statusConfig: Record<KycStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending: {
      label: 'Verification submitted — under review',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      icon: <span className="text-amber-500">●</span>,
    },
    in_review: {
      label: 'Identity check in progress...',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      icon: <Spinner className="w-4 h-4 text-blue-500" />,
    },
    verified: {
      label: 'Identity verified',
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: (
        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    rejected: {
      label: 'Verification rejected',
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: <span className="text-red-500">✕</span>,
    },
  };

  const status = statusConfig[kycStatus];

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Organization</p>
        <p className="text-base font-semibold text-gray-900">{org.legal_name}</p>
        <p className="text-sm text-gray-500">{COUNTRY_LABELS[org.country] ?? org.country}</p>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">
        Your organization has been created. Complete identity verification to list
        your deal on the platform. You&apos;ll be redirected to our KYC partner — keep
        this tab open to track progress.
      </p>

      {!kycStarted ? (
        <>
          {error && <ErrorBanner message={error} />}
          <button
            onClick={handleBeginVerification}
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="w-4 h-4 text-white" />
                Initiating...
              </span>
            ) : (
              'Begin Verification'
            )}
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${status.color}`}>
            {status.icon}
            {status.label}
          </div>

          {kycStatus === 'rejected' && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              Your verification was rejected. Please contact{' '}
              <a href="mailto:support@borderlessraise.com" className="underline font-medium">
                support@borderlessraise.com
              </a>{' '}
              to resolve this.
            </div>
          )}

          {(kycStatus === 'pending' || kycStatus === 'in_review') && (
            <p className="text-xs text-gray-400 text-center">
              Checking status every 3 seconds...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Confirmation ─────────────────────────────────────────────────────

function Step3Confirmation({ org }: { org: OrgResult }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">You&apos;re verified and ready to raise.</h3>
        <p className="text-sm text-gray-500 mt-1">
          Your deal is now eligible to be listed to accredited investors.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-gray-500">Company</span>
          <span className="text-sm font-medium text-gray-900">{org.legal_name}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-gray-500">Country</span>
          <span className="text-sm font-medium text-gray-900">
            {COUNTRY_LABELS[org.country] ?? org.country}
          </span>
        </div>
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-gray-500">Raise Target</span>
          <span className="text-sm font-medium text-gray-900">
            {formatUsd(org.raise_amount_usd)}
          </span>
        </div>
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm text-gray-500">KYC Status</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Verified
          </span>
        </div>
      </div>

      <a
        href="/investor/deals"
        className="block w-full text-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
      >
        View Your Deal
      </a>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STEP_TITLES = [
  { heading: 'Register your company', sub: 'Tell us about your organization and raise.' },
  { heading: 'Verify your identity', sub: 'KYC is required to list your deal.' },
  { heading: 'All done!', sub: 'Your account is ready.' },
];

export default function StartupOnboardPage() {
  const [step, setStep] = useState(1);
  const [org, setOrg] = useState<OrgResult | null>(null);

  function handleOrgCreated(result: OrgResult) {
    setOrg(result);
    setStep(2);
  }

  function handleVerified() {
    setStep(3);
  }

  const title = STEP_TITLES[step - 1];

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
          <h1 className="text-xl font-semibold text-gray-900">{title.heading}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{title.sub}</p>
        </div>

        <div className="border-t border-gray-100 pt-6">
          {step === 1 && <Step1Form onSuccess={handleOrgCreated} />}
          {step === 2 && org && (
            <Step2Kyc org={org} onVerified={handleVerified} />
          )}
          {step === 3 && org && <Step3Confirmation org={org} />}
        </div>
      </div>
    </div>
  );
}
