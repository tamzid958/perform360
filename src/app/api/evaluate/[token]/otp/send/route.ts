import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params: _params }: { params: { token: string } }
) {
  // In production: validate token, rate limit, generate OTP, hash, send email
  return NextResponse.json({
    success: true,
    data: { sent: true, expiresIn: 600 },
  });
}
