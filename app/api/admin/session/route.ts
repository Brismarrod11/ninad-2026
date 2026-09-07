import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  COOKIE_NAME,
  verifyAdminSession,
} from "../../../../lib/admin-auth";

export async function GET() {
  const cookieStore =
    await cookies();

  const session =
    cookieStore.get(
      COOKIE_NAME
    )?.value;

  const authenticated =
    verifyAdminSession(
      session
    );

  return NextResponse.json({
    authenticated,
  });
}