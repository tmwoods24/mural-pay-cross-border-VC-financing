'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgSnapshot {
  legal_name: string;
  country: string;
  mural_org_id: string | null;
}

interface DealSnapshot {
  id: string;
  organization_id: string;
  target_amount_usd: number;
  organizations: OrgSnapshot | null;
}

interface InvestorSnapshot {
  id: string;
  name: string;
  email: string;
}

interface DisbursableCommitment {
  id: string;
  created_at: string;
  amount_usd: number;
  local_currency: string;
  local_amount: number | null;
  fx_rate_at_commitment: number | null;
  mural_payin_id: string | null;
  deals: DealSnapshot | null;
  investors: InvestorSnapshot | null;
}

interface CompletedTransaction {
  id: string;
  mural_payout_id: string | null;
  local_currency: string | null;
  local_amount: number | null;
  status: string;
  created_at: string;
}

type CardState =
  | { type: 'idle' }
  | { type: 'confirming' }
  | { type: 'processing' }
  | { type: 'success'; txn: CompletedTransaction }
  | { type: 'error'; message: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRY_META: Record<string, { flag: string; name: string }> = {
  NG: { flag: '🇳🇬', name: 'Nigeria' },
  KE: { flag: '🇰🇪', name: 'Kenya' },
  CO: { flag: '🇨🇴', name: 'Colombia' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatLocal(amount: number, currency: string) {
  return (
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount) +
    ' ' +
    currency
  );
}

function truncate(s: string | null | undefined, len = 24) {
  if (!s) return '—';
  return s.length > len ? s.slice(0, len) + '…' : s;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="h-4 w-48 bg-gray-100 rounded" />
      <div className="h-8 w-32 bg-gray-200 rounded" />
      <div className="h-4 w-56 bg-gray-100 rounded" />
      <div className="h-10 w-full bg-gray-100 rounded-lg" />
    </div>
  );
}

// ─── Confirmation modal ───────────────────────────────────────────────────────

function ConfirmModal({
  commitment,
  onCancel,
  onConfirm,
}: {
  commitment: DisbursableCommitment;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const org = commitment.deals?.organizations;
  const country = org?.country ?? '';
  const meta = COUNTRY_META[country];
  const currency = commitment.local_currency;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Confirm Disbursement</h3>
            <p className="text-xs text-gray-500">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          You are about to release{' '}
          <span className="font-semibold text-gray-900">{formatUsd(commitment.amount_usd)}</span>{' '}
          to{' '}
          <span className="font-semibold text-gray-900">{org?.legal_name ?? 'this startup'}</span>{' '}
          in{' '}
          <span className="font-semibold text-gray-900">
            {meta ? `${meta.flag} ` : ''}{currency}
          </span>.
        </p>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            Confirm Release
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Commitment card ──────────────────────────────────────────────────────────

function CommitmentCard({ commitment }: { commitment: DisbursableCommitment }) {
  const [state, setState] = useState<CardState>({ type: 'idle' });

  const org = commitment.deals?.organizations;
  const country = org?.country ?? '';
  const meta = COUNTRY_META[country];
  const investor = commitment.investors;

  async function executePayout() {
    setState({ type: 'processing' });
    try {
      const res = await fetch('/api/mural/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitmentId: commitment.id,
          organizationId: commitment.deals?.organization_id ?? '',
          muralOrgId: org?.mural_org_id ?? '',
          legalName: org?.legal_name ?? '',
          country,
          localCurrency: commitment.local_currency,
          amountUsd: commitment.amount_usd,
          fxRate: commitment.fx_rate_at_commitment ?? 1,
          localAmount: commitment.local_amount ?? 0,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setState({ type: 'error', message: json.error ?? 'Payout failed.' });
        return;
      }

      setState({ type: 'success', txn: json as CompletedTransaction });
    } catch {
      setState({ type: 'error', message: 'Network error — please retry.' });
    }
  }

  // ── Success state ──
  if (state.type === 'success') {
    const txn = state.txn;
    return (
      <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">Capital released</p>
            <p className="text-xs text-gray-500">
              Completed {new Date(txn.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Company</span>
            <span className="font-medium text-gray-900">{org?.legal_name}</span>
          </div>
          {txn.local_amount && txn.local_currency && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivered</span>
              <span className="font-medium text-gray-900">
                {formatLocal(txn.local_amount, txn.local_currency)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Transaction ID</span>
            <span className="font-mono text-xs text-gray-700">{truncate(txn.mural_payout_id, 20)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state (overlaid) ──
  const showError = state.type === 'error';
  const isProcessing = state.type === 'processing';

  return (
    <>
      {state.type === 'confirming' && (
        <ConfirmModal
          commitment={commitment}
          onCancel={() => setState({ type: 'idle' })}
          onConfirm={executePayout}
        />
      )}

      <div className={`bg-white rounded-2xl border shadow-sm p-6 space-y-4 transition ${showError ? 'border-red-200' : 'border-gray-100'}`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-gray-900 leading-tight">
              {meta?.flag ?? ''} {org?.legal_name ?? '—'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {meta?.name ?? country} · {commitment.local_currency}
            </p>
          </div>
          <span className="shrink-0 text-xs font-mono bg-gray-50 border border-gray-200 text-gray-500 rounded px-2 py-0.5">
            {truncate(commitment.mural_payin_id, 14)}
          </span>
        </div>

        {/* Investor */}
        {investor && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-indigo-600">
                {investor.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 leading-none">{investor.name}</p>
              <p className="text-xs text-gray-400">{investor.email}</p>
            </div>
          </div>
        )}

        {/* Amount */}
        <div>
          <p className="text-2xl font-bold text-gray-900">{formatUsd(commitment.amount_usd)}</p>
          {commitment.local_amount && (
            <p className="text-sm text-gray-500 mt-0.5">
              ≈ {formatLocal(commitment.local_amount, commitment.local_currency)}
              {commitment.fx_rate_at_commitment && (
                <span className="text-gray-400">
                  {' '}at {commitment.fx_rate_at_commitment.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Error banner */}
        {showError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {(state as { type: 'error'; message: string }).message}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() =>
            showError
              ? setState({ type: 'idle' })
              : setState({ type: 'confirming' })
          }
          disabled={isProcessing}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner className="w-4 h-4 text-white" />
              Processing payout...
            </span>
          ) : showError ? (
            'Retry'
          ) : (
            'Release Capital'
          )}
        </button>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [commitments, setCommitments] = useState<DisbursableCommitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/mural/payouts');
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Failed to load commitments');
      }
      const data = await res.json();
      setCommitments(data as DisbursableCommitment[]);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900 leading-none">Disbursement Panel</h1>
              <p className="text-xs text-gray-400 mt-0.5">Review funded commitments and release capital to startups</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Mock Mode
            </span>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {fetchError && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {fetchError}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
          </div>
        ) : commitments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">No pending disbursements</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm leading-relaxed">
              No funded commitments pending disbursement. Commitments appear here once
              investor payins are confirmed.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">
              {commitments.length} commitment{commitments.length !== 1 ? 's' : ''} ready for disbursement
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {commitments.map((c) => (
                <CommitmentCard key={c.id} commitment={c} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
