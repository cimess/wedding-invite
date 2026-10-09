// lib/scanner-auth.ts

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

const SCANNER_COOKIE = "wedding_scanner_session";
const SESSION_DURATION = 60 * 60 * 12; // 12 hours

function getSessionSecret() {
  const secret = process.env.SCANNER_SESSION_SECRET;

  if (!secret) {
    throw new Error("SCANNER_SESSION_SECRET is not configured");
  }

  return secret;
}

function createSignature(payload: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

export function createScannerSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION;

  const payload = `scanner:${expiresAt}`;

  const signature = createSignature(payload);

  return `${payload}.${signature}`;
}

function verifyScannerSession(token: string) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = createSignature(payload);

  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  if (
    !crypto.timingSafeEqual(
      receivedBuffer,
      expectedBuffer
    )
  ) {
    return false;
  }

  const [type, expiresAtString] = payload.split(":");

  if (type !== "scanner") {
    return false;
  }

  const expiresAt = Number(expiresAtString);

  if (!Number.isFinite(expiresAt)) {
    return false;
  }

  if (Date.now() >= expiresAt * 1000) {
    return false;
  }

  return true;
}

export async function isScannerAuthenticated() {
  await connection();

  const cookieStore = await cookies();

  const session = cookieStore.get(SCANNER_COOKIE);

  if (!session?.value) {
    return false;
  }

  return verifyScannerSession(session.value);
}

export { SCANNER_COOKIE, SESSION_DURATION };