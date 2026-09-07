import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();

    // Get all parishes from MongoDB
    const parishes = await db
      .collection("parishes")
      .find({})
      .sort({ name: 1 })
      .toArray();

    // Get all registrations from MongoDB
    const registrations = await db
      .collection("registrations")
      .find({})
      .toArray();

    // Combine parish and registration data
    const parishList = parishes.map((parish) => {
      const parishName = String(
        parish.name || ""
      )
        .trim()
        .toLowerCase();

      const registration = registrations.find(
        (item) => {
          const registrationParish = String(
            item.parish || ""
          )
            .trim()
            .toLowerCase();

          return (
            registrationParish === parishName
          );
        }
      );

      const coordinators =
        registration?.coordinators || [];

      const children =
        registration?.children || [];

      return {
        id: parish._id.toString(),

        name: parish.name,

        registered: Boolean(registration),

        status: registration
          ? registration.status || "draft"
          : "not_registered",

        registrationCode:
          registration?.registrationCode ||
          null,

        coordinatorCount:
          coordinators.length,

        childCount:
          children.length,

        createdAt:
          registration?.createdAt ||
          null,

        updatedAt:
          registration?.updatedAt ||
          null,

        submittedAt:
          registration?.submittedAt ||
          null,
      };
    });

    // -----------------------------------------
    // SUMMARY
    // -----------------------------------------

    const totalParishes =
      parishList.length;

    const registered =
      parishList.filter(
        (parish) =>
          parish.registered
      ).length;

    const submitted =
      parishList.filter(
        (parish) =>
          parish.status === "submitted"
      ).length;

    const drafts =
      parishList.filter(
        (parish) =>
          parish.status === "draft"
      ).length;

    const notRegistered =
      parishList.filter(
        (parish) =>
          !parish.registered
      ).length;

    const totalChildren =
      parishList.reduce(
        (total, parish) =>
          total + parish.childCount,
        0
      );

    const totalCoordinators =
      parishList.reduce(
        (total, parish) =>
          total +
          parish.coordinatorCount,
        0
      );

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------

    return NextResponse.json({
      success: true,

      summary: {
        totalParishes,
        registered,
        submitted,
        drafts,
        notRegistered,
        totalChildren,
        totalCoordinators,
      },

      parishes: parishList,
    });
  } catch (error) {
    console.error(
      "Admin parish API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to load parishes",
      },
      {
        status: 500,
      }
    );
  }
}
