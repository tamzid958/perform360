import { NextRequest, NextResponse } from "next/server";

// POST /api/evaluate/[token]/otp/send
export async function POST(
  _request: NextRequest,
  { params: _params }: { params: { token: string } }
) {
  // Determine action from URL - this is a catch-all for the otp directory
  // In production: generate OTP, hash, store, send email
  return NextResponse.json({
    success: true,
    data: { sent: true, expiresIn: 600 },
  });
}
