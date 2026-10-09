import { NextResponse } from "next/server";
import { isScannerAuthenticated } from "@/app/lib/scanner.auth";

export async function GET() {
  const authenticated = await isScannerAuthenticated();

  return NextResponse.json({
    authenticated,
  });
}