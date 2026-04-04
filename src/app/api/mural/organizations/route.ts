import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "GET /api/mural/organizations - stub" });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: "POST /api/mural/organizations - stub" });
}
