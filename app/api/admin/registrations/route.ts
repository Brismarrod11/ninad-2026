import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();

    const registrations = await db
      .collection("registrations")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const formattedRegistrations = registrations.map(
      (registration) => ({
        id: registration._id.toString(),

        parish: registration.parish || "",

        status: registration.status || "draft",

        registrationCode:
          registration.registrationCode || null,

        coordinators:
          registration.coordinators || [],

        children:
          registration.children || [],

        coordinatorCount:
          (registration.coordinators || []).length,

        childCount:
          (registration.children || []).length,

        createdAt:
          registration.createdAt || null,

        updatedAt:
          registration.updatedAt || null,

        submittedAt:
          registration.submittedAt || null,
      })
    );

    // -----------------------------------------
    // SUMMARY
    // -----------------------------------------

    const totalRegistrations =
      formattedRegistrations.length;

    const submitted =
      formattedRegistrations.filter(
        (item) => item.status === "submitted"
      ).length;

    const drafts =
      formattedRegistrations.filter(
        (item) => item.status !== "submitted"
      ).length;

    const totalChildren =
      formattedRegistrations.reduce(
        (total, item) =>
          total + item.childCount,
        0
      );

    const totalCoordinators =
      formattedRegistrations.reduce(
        (total, item) =>
          total + item.coordinatorCount,
        0
      );

    return NextResponse.json({
      success: true,

      summary: {
        totalRegistrations,
        submitted,
        drafts,
        totalChildren,
        totalCoordinators,
      },

      registrations:
        formattedRegistrations,
    });
  } catch (error) {
    console.error(
      "Admin registrations error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load registrations",
      },
      { status: 500 }
    );
  }
}