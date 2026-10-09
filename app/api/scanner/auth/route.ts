import { NextRequest, NextResponse } from "next/server";
import {
  createScannerSession,
  SCANNER_COOKIE,
  SESSION_DURATION,
} from "@/app/lib/scanner.auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const pin = String(body.pin ?? "");

    const adminPin = process.env.SCANNER_ADMIN_PIN;

    if (!adminPin) {
      console.error("SCANNER_ADMIN_PIN is not configured");

      return NextResponse.json(
        {
          error: "Scanner authentication is not configured",
        },
        {
          status: 500,
        }
      );
    }

    if (!pin || pin !== adminPin) {
      return NextResponse.json(
        {
          error: "Invalid PIN",
        },
        {
          status: 401,
        }
      );
    }

    const session = createScannerSession();

    const response = NextResponse.json({
      authenticated: true,
    });

    response.cookies.set({
      name: SCANNER_COOKIE,
      value: session,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION,
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request",
      },
      {
        status: 400,
      }
    );
  }
}