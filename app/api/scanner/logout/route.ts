import { NextResponse } from "next/server";
import { SCANNER_COOKIE } from "@/app/lib/scanner.auth";

export async function POST() {
  const response = NextResponse.json({
    authenticated: false,
  });

  response.cookies.set({
    name: SCANNER_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}