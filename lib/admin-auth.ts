import crypto from "crypto";

export const COOKIE_NAME = "ninad_admin_session";

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is missing from .env.local"
    );
  }

  return secret;
}

function createSignature(timestamp: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(timestamp)
    .digest("hex");
}

export function createAdminSession(): string {
  const timestamp = Date.now().toString();
  const signature = createSignature(timestamp);

  return `${timestamp}.${signature}`;
}

export function verifyAdminSession(
  session: string | undefined
): boolean {
  if (!session) {
    return false;
  }

  const parts = session.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const timestamp = parts[0];
  const signature = parts[1];

  const timestampNumber = Number(timestamp);

  if (!Number.isFinite(timestampNumber)) {
    return false;
  }

  const sessionLength = 8 * 60 * 60 * 1000;

  const age = Date.now() - timestampNumber;

  if (age < 0 || age > sessionLength) {
    return false;
  }

  const expectedSignature =
    createSignature(timestamp);

  if (
    signature.length !==
    expectedSignature.length
  ) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}