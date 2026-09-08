import { NextResponse } from "next/server";
import { getParishSession } from "../../../../lib/parish-auth";

export async function GET() {
  try {
    const session = await getParishSession();

    if (!session?.parish) {
      return NextResponse.json(
        {
          success: false,
          error: "Parish authentication required.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      parish: session.parish,
    });
  } catch (error) {
    console.error(
      "Parish session error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to verify parish session.",
      },
      { status: 500 }
    );
  }
}