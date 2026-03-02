import { NextResponse } from "next/server";
import { clearSelectedCompany } from "@/lib/company-cookie";

export async function POST() {
  await clearSelectedCompany();
  return NextResponse.json({ success: true });
}
