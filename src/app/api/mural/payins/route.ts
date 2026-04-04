import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "GET /api/mural/payins - stub" });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: "POST /api/mural/payins - stub" });
}
