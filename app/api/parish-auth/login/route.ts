import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDatabase } from "../../../../lib/mongodb";
import {
  createParishSession,
  getParishCookieName,
} from "../../../../lib/parish-auth";

function hashCode(code: string) {
  return crypto
    .createHash("sha256")
    .update(code.trim().toUpperCase())
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parish = String(body.parish || "").trim();
    const accessCode = String(body.accessCode || "").trim();

    if (!parish || !accessCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Parish and access code are required.",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const parishRecord = await db
      .collection("parishes")
      .findOne({
        name: parish,
      });

    if (!parishRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid parish or access code.",
        },
        { status: 401 }
      );
    }

    const storedHash =
      parishRecord.parishAccessCodeHash;

    if (!storedHash) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access code has not been configured for this parish.",
        },
        { status: 403 }
      );
    }

    const suppliedHash = hashCode(accessCode);

    if (
      suppliedHash.length !== storedHash.length ||
      !crypto.timingSafeEqual(
        Buffer.from(suppliedHash),
        Buffer.from(storedHash)
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid parish or access code.",
        },
        { status: 401 }
      );
    }

    const session = createParishSession(parish);

    const response = NextResponse.json({
      success: true,
      parish,
    });

    response.cookies.set({
      name: getParishCookieName(),
      value: session,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Parish login error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to authenticate parish.",
      },
      { status: 500 }
    );
  }
}