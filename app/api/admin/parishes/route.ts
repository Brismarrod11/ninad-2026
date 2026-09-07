import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();

    const parishes = await db
      .collection("parishes")
      .find({})
      .sort({ name: 1 })
      .toArray();

    const registrations = await db
      .collection("registrations")
      .find({})
      .toArray();

    const parishList = parishes.map((parish) => {
      const parishName = String(parish.name || "")
        .trim()
        .toLowerCase();

      const registration = registrations.find(
        (item) =>
          String(item.parish || "")
            .trim()
            .toLowerCase() === parishName
      );

      return {
        id: parish._id.toString(),
        name: parish.name,

        registered: Boolean(registration),

        status: registration?.status || "not_registered",

        registrationCode:
          registration?.registrationCode || null,

        coordinatorCount:
          registration?.coordinators?.length || 0,

        childCount:
          registration?.children?.length || 0,

        createdAt:
          registration?.createdAt || null,

        updatedAt:
          registration?.updatedAt || null,

        submittedAt:
          registration?.submittedAt || null,
      };
    });

    const summary = {
      totalParishes: parishList.length,

      registered: parishList.filter(
        (p) => p.registered
      ).length,

      submitted: parishList.filter(
        (p) => p.status === "submitted"
      ).length,

      drafts: parishList.filter(
        (p) => p.status === "draft"
      ).length,

      notRegistered: parishList.filter(
        (p) => !p.registered
      ).length,

      totalChildren: parishList.reduce(
        (total, p) => total + p.childCount,
        0
      ),

      totalCoordinators: parishList.reduce(
        (total, p) => total + p.coordinatorCount,
        0
      ),
    };

    return NextResponse.json({
      success: true,
      summary,
      parishes: parishList,
    });
  } catch (error) {
    console.error("Admin parishes error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load parishes",
      },
      { status: 500 }
    );
  }
}