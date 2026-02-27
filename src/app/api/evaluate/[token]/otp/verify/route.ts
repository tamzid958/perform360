import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params: _params }: { params: { token: string } }
) {
  try {
    const body = await request.json();
    const { otp } = body;

    if (!otp || otp.length !== 6) {
      return NextResponse.json({
        success: false,
        error: "Invalid OTP format",
      }, { status: 400 });
    }

    // In production: verify OTP against hash, check expiry, issue session token
    return NextResponse.json({
      success: true,
      data: { verified: true },
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: "Verification failed",
    }, { status: 500 });
  }
}
