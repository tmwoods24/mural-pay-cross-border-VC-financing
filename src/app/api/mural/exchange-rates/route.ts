import { NextRequest } from 'next/server';
import { getMuralClient } from '@/lib/mural/index';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get('from') ?? 'USD';
  const to = searchParams.get('to');

  if (!to) {
    return Response.json(
      { error: "'to' query param is required (e.g. NGN, KES, COP)" },
      { status: 400 },
    );
  }

  try {
    const rate = await getMuralClient().getExchangeRate(from, to);
    return Response.json({
      rate: rate.rate,
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      timestamp: rate.timestamp,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
}
