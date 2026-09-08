import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "ninad_parish_session";

type ParishSession = {
  parish: string;
  expiresAt: number;
};

function getSecret() {
  const secret = process.env.PARISH_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "PARISH_SESSION_SECRET is not configured"
    );
  }

  return secret;
}

function sign(value: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(value)
    .digest("base64url");
}

export function createParishSession(parish: string) {
  const payload: ParishSession = {
    parish,
    expiresAt:
      Date.now() + 1000 * 60 * 60 * 24 * 30,
  };

  const encoded = Buffer.from(
    JSON.stringify(payload)
  ).toString("base64url");

  const signature = sign(encoded);

  return `${encoded}.${signature}`;
}

export function verifyParishSession(
  token: string | undefined
): ParishSession | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [encoded, signature] = parts;

  const expectedSignature = sign(encoded);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(
      signatureBuffer,
      expectedBuffer
    )
  ) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as ParishSession;

    if (!session.parish || !session.expiresAt) {
      return null;
    }

    if (session.expiresAt < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getParishSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(COOKIE_NAME)?.value;

  return verifyParishSession(token);
}

export function getParishCookieName() {
  return COOKIE_NAME;
}