import crypto from "crypto";

const COOKIE_NAME = "ninad_admin_session";

function getSecret() {
  const secret =
    process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is missing from .env.local"
    );
  }

  return secret;
}

function createSignature(
  value: string
) {
  return crypto
    .createHmac(
      "sha256",
      getSecret()
    )
    .update(value)
    .digest("hex");
}

export function createAdminSession() {
  const timestamp =
    Date.now().toString();

  const signature =
    createSignature(timestamp);

  return `${timestamp}.${signature}`;
}

export function verifyAdminSession(
  session: string | undefined
) {
  if (!session) {
    return false;
  }

  const parts =
    session.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [timestamp, signature] =
    parts;

  const time =
    Number(timestamp);

  if (!Number.isFinite(time)) {
    return false;
  }

  // Session expires after 8 hours
  const eightHours =
    8 * 60 * 60 * 1000;

  if (
    Date.now() - time >
    eightHours
  ) {
    return false;
  }

  const expected =
    createSignature(timestamp);

  if (
    signature.length !==
    expected.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export {
  COOKIE_NAME,
};