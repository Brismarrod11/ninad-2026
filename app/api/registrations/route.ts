import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";

type Coordinator = {
  id: number;
  name: string;
  mobile: string;
};

type Child = {
  id: number;
  name: string;
  className: string;
  gender: "Boy" | "Girl";
  parentMobile: string;
};

// =====================================================
// GET
// Load registration for a parish
// =====================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parish = searchParams.get("parish");

    if (!parish) {
      return NextResponse.json(
        {
          success: false,
          error: "Parish is required",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const registration = await db
      .collection("registrations")
      .findOne({ parish });

    return NextResponse.json({
      success: true,
      registration,
    });
  } catch (error) {
    console.error("GET registration error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load registration",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// POST
// Add Coordinator
// Add Child
// Final Submit
// =====================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parish = body.parish;
    const action = body.action;

    const coordinator =
      body.coordinator as Coordinator | undefined;

    const child =
      body.child as Child | undefined;

    if (!parish) {
      return NextResponse.json(
        {
          success: false,
          error: "Parish is required",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const registrations =
      db.collection("registrations");

    // -------------------------------------------------
    // Make sure registration code is unique
    // -------------------------------------------------

    await registrations.createIndex(
      { registrationCode: 1 },
      {
        unique: true,
        sparse: true,
      }
    );

    // =================================================
    // FINAL SUBMISSION
    // =================================================

    if (action === "submit") {
      const registration =
        await registrations.findOne({ parish });

      if (!registration) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Registration not found. Please add your coordinator and children first.",
          },
          { status: 404 }
        );
      }

      // -------------------------------------------------
      // Already submitted
      // -------------------------------------------------

      if (registration.status === "submitted") {
        return NextResponse.json({
          success: true,
          alreadySubmitted: true,
          message:
            "This registration has already been submitted.",
          registrationCode:
            registration.registrationCode || "",
          registration,
        });
      }

      // -------------------------------------------------
      // Validate coordinator
      // -------------------------------------------------

      const coordinators =
        (registration.coordinators ||
          []) as Coordinator[];

      if (coordinators.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Please add at least one coordinator before submitting.",
          },
          { status: 400 }
        );
      }

      // -------------------------------------------------
      // Validate children
      // -------------------------------------------------

      const children =
        (registration.children ||
          []) as Child[];

      if (children.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Please add at least one child before submitting.",
          },
          { status: 400 }
        );
      }

      // -------------------------------------------------
      // Generate registration number
      // -------------------------------------------------

      const parishCode = parish
        .replace(/[^a-zA-Z]/g, "")
        .toUpperCase()
        .slice(0, 3)
        .padEnd(3, "X");

      let registrationCode = "";

      let codeIsUnique = false;

      while (!codeIsUnique) {
        const randomNumber = Math.floor(
          100000 + Math.random() * 900000
        );

        registrationCode =
          `NINAD26-${parishCode}-${randomNumber}`;

        const existing =
          await registrations.findOne({
            registrationCode,
          });

        if (!existing) {
          codeIsUnique = true;
        }
      }

      // -------------------------------------------------
      // Submit registration
      // -------------------------------------------------

      const submittedAt = new Date();

      const updateResult =
        await registrations.updateOne(
          {
            parish,
            status: {
              $ne: "submitted",
            },
          },
          {
            $set: {
              status: "submitted",
              registrationCode,
              submittedAt,
              updatedAt: submittedAt,
            },
          }
        );

      // -------------------------------------------------
      // Safety check
      // -------------------------------------------------

      if (updateResult.modifiedCount === 0) {
        const latest =
          await registrations.findOne({ parish });

        if (
          latest &&
          latest.status === "submitted"
        ) {
          return NextResponse.json({
            success: true,
            alreadySubmitted: true,
            message:
              "This registration has already been submitted.",
            registrationCode:
              latest.registrationCode || "",
            registration: latest,
          });
        }

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to submit registration. Please try again.",
          },
          { status: 500 }
        );
      }

      // -------------------------------------------------
      // Get final registration
      // -------------------------------------------------

      const finalRegistration =
        await registrations.findOne({
          parish,
        });

      return NextResponse.json({
        success: true,
        message:
          "Registration submitted successfully.",
        registrationCode,
        registration: finalRegistration,
      });
    }

    // =================================================
    // CREATE / UPDATE DRAFT
    // =================================================

    const now = new Date();

    await registrations.createIndex(
      { parish: 1 },
      {
        unique: true,
      }
    );

    await registrations.updateOne(
      { parish },
      {
        $setOnInsert: {
          parish,
          status: "draft",
          createdAt: now,
          coordinators: [],
          children: [],
        },
        $set: {
          updatedAt: now,
        },
      },
      {
        upsert: true,
      }
    );

    // =================================================
    // ADD COORDINATOR
    // =================================================

    if (action === "addCoordinator") {
      if (
        !coordinator?.name ||
        !coordinator?.mobile
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Coordinator name and mobile number are required",
          },
          { status: 400 }
        );
      }

      // -------------------------------------------------
      // IMPORTANT:
      // Coordinator can be added even after submission.
      // -------------------------------------------------

      await registrations.updateOne(
  { parish },
  {
    $push: {
      coordinators: {
        $each: [coordinator],
      },
    } as any,
    $set: {
      updatedAt: now,
    },
  }
);
    }

    // =================================================
    // ADD CHILD
    // =================================================

    else if (action === "addChild") {
      if (
        !child?.name ||
        !child?.className ||
        !child?.gender ||
        !child?.parentMobile
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "All child details are required",
          },
          { status: 400 }
        );
      }

      // -------------------------------------------------
      // IMPORTANT:
      // Child can be added even after submission.
      // -------------------------------------------------

      await registrations.updateOne(
  { parish },
  {
    $push: {
      children: {
        $each: [child],
      },
    } as any,
    $set: {
      updatedAt: now,
    },
  }
);
    }

    // =================================================
    // INVALID ACTION
    // =================================================

    else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action",
        },
        { status: 400 }
      );
    }

    // =================================================
    // RETURN UPDATED REGISTRATION
    // =================================================

    const registration =
      await registrations.findOne({
        parish,
      });

    return NextResponse.json({
      success: true,
      registration,
    });
  } catch (error) {
    console.error(
      "POST registration error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save registration",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// PATCH
// Edit Coordinator / Child
// =====================================================

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const parish = body.parish;
    const type = body.type;
    const id = body.id;
    const data = body.data;

    if (
      !parish ||
      !type ||
      id === undefined ||
      !data
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required information",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const registrations =
      db.collection("registrations");

    const registration =
      await registrations.findOne({
        parish,
      });

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration not found",
        },
        { status: 404 }
      );
    }

    // =================================================
    // IMPORTANT:
    // Editing is allowed even after submission.
    // =================================================

    // =================================================
    // EDIT COORDINATOR
    // =================================================

    if (type === "coordinator") {
      const coordinators =
        (registration.coordinators ||
          []) as Coordinator[];

      const updatedCoordinators =
        coordinators.map((item) => {
          if (
            String(item.id) === String(id)
          ) {
            return {
              ...item,
              name:
                data.name ?? item.name,
              mobile:
                data.mobile ?? item.mobile,
            };
          }

          return item;
        });

      await registrations.updateOne(
        { parish },
        {
          $set: {
            coordinators:
              updatedCoordinators,
            updatedAt: new Date(),
          },
        }
      );
    }

    // =================================================
    // EDIT CHILD
    // =================================================

    else if (type === "child") {
      const children =
        (registration.children ||
          []) as Child[];

      const updatedChildren =
        children.map((item) => {
          if (
            String(item.id) === String(id)
          ) {
            return {
              ...item,
              name:
                data.name ?? item.name,
              className:
                data.className ??
                item.className,
              gender:
                data.gender ?? item.gender,
              parentMobile:
                data.parentMobile ??
                item.parentMobile,
            };
          }

          return item;
        });

      await registrations.updateOne(
        { parish },
        {
          $set: {
            children:
              updatedChildren,
            updatedAt: new Date(),
          },
        }
      );
    }

    // =================================================
    // INVALID TYPE
    // =================================================

    else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid type",
        },
        { status: 400 }
      );
    }

    // =================================================
    // RETURN UPDATED REGISTRATION
    // =================================================

    const updatedRegistration =
      await registrations.findOne({
        parish,
      });

    return NextResponse.json({
      success: true,
      registration:
        updatedRegistration,
    });
  } catch (error) {
    console.error(
      "PATCH registration error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update registration",
      },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE
// Delete Coordinator / Child
// =====================================================

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const parish = body.parish;
    const type = body.type;
    const id = body.id;

    if (
      !parish ||
      !type ||
      id === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required information",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const registrations =
      db.collection("registrations");

    const registration =
      await registrations.findOne({
        parish,
      });

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          error: "Registration not found",
        },
        { status: 404 }
      );
    }

    // =================================================
    // IMPORTANT:
    // Deleting is allowed even after submission.
    // =================================================

    // =================================================
    // DELETE COORDINATOR
    // =================================================

    if (type === "coordinator") {
      const coordinators =
        (registration.coordinators ||
          []) as Coordinator[];

      const updatedCoordinators =
        coordinators.filter(
          (item) =>
            String(item.id) !==
            String(id)
        );

      await registrations.updateOne(
        { parish },
        {
          $set: {
            coordinators:
              updatedCoordinators,
            updatedAt: new Date(),
          },
        }
      );
    }

    // =================================================
    // DELETE CHILD
    // =================================================

    else if (type === "child") {
      const children =
        (registration.children ||
          []) as Child[];

      const updatedChildren =
        children.filter(
          (item) =>
            String(item.id) !==
            String(id)
        );

      await registrations.updateOne(
        { parish },
        {
          $set: {
            children:
              updatedChildren,
            updatedAt: new Date(),
          },
        }
      );
    }

    // =================================================
    // INVALID TYPE
    // =================================================

    else {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid type",
        },
        { status: 400 }
      );
    }

    // =================================================
    // RETURN UPDATED REGISTRATION
    // =================================================

    const updatedRegistration =
      await registrations.findOne({
        parish,
      });

    return NextResponse.json({
      success: true,
      registration:
        updatedRegistration,
    });
  } catch (error) {
    console.error(
      "DELETE registration error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete registration",
      },
      { status: 500 }
    );
  }
}