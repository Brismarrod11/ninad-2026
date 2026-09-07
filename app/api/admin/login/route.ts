import {
  NextResponse,
} from "next/server";

import {
  createAdminSession,
  COOKIE_NAME,
} from "../../../../lib/admin-auth";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const username =
      String(
        body.username || ""
      ).trim();

    const password =
      String(
        body.password || ""
      );

    const expectedUsername =
      process.env.ADMIN_USERNAME;

    const expectedPassword =
      process.env.ADMIN_PASSWORD;

    if (
      !expectedUsername ||
      !expectedPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin credentials are not configured.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      username !==
        expectedUsername ||
      password !==
        expectedPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid username or password.",
        },
        {
          status: 401,
        }
      );
    }

    const session =
      createAdminSession();

    const response =
      NextResponse.json({
        success: true,
      });

    response.cookies.set(
      COOKIE_NAME,
      session,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge:
          8 * 60 * 60,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Admin login error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to login.",
      },
      {
        status: 500,
      }
    );
  }
}