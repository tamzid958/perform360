import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  // In production: validate token, check assignment status
  return NextResponse.json({
    success: true,
    data: { token: params.token, valid: true },
  });
}

export async function POST(
  request: NextRequest,
  { params: _params }: { params: { token: string } }
) {
  try {
    await request.json();
    // In production: validate OTP session, encrypt answers, save to DB
    return NextResponse.json({
      success: true,
      data: { submitted: true },
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: "Failed to submit evaluation",
    }, { status: 500 });
  }
}
