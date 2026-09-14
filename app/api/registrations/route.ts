import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";
import { getParishSession } from "../../../lib/parish-auth";

type Coordinator = {
  id: number;
  name: string;
  mobile: string;
  email?: string;
};

type Child = {
  id: number;
  name: string;
  className: string;
  gender: "Boy" | "Girl";
  parentMobile: string;
};

async function getAuthorizedParish() {
  const session = await getParishSession();

  if (!session?.parish) {
    return null;
  }

  return session.parish;
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Parish access required. Please log in with your parish access code.",
    },
    { status: 401 }
  );
}

function forbiddenResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "You do not have access to this parish.",
    },
    { status: 403 }
  );
}

function checkRequestedParish(
  requestedParish: unknown,
  authorizedParish: string
) {
  if (
    requestedParish !== undefined &&
    requestedParish !== null &&
    String(requestedParish).trim() !== "" &&
    String(requestedParish).trim() !== authorizedParish
  ) {
    return false;
  }

  return true;
}

// =====================================================
// GET
// Load registration for authenticated parish
// =====================================================

export async function GET(request: Request) {
  try {
    const authorizedParish =
      await getAuthorizedParish();

    if (!authorizedParish) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);

    const requestedParish =
      searchParams.get("parish");

    if (
      !checkRequestedParish(
        requestedParish,
        authorizedParish
      )
    ) {
      return forbiddenResponse();
    }

    const db = await getDatabase();

    const registration = await db
      .collection("registrations")
      .findOne({
        parish: authorizedParish,
      });

    return NextResponse.json({
      success: true,
      registration,
      parish: authorizedParish,
    });
  } catch (error) {
    console.error(
      "GET registration error:",
      error
    );

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

    const authorizedParish =
      await getAuthorizedParish();

    if (!authorizedParish) {
      return unauthorizedResponse();
    }

    /*
     * IMPORTANT:
     * The browser may send body.parish,
     * but it is NEVER trusted.
     *
     * The authenticated session decides
     * which parish can be modified.
     */

    if (
      !checkRequestedParish(
        body.parish,
        authorizedParish
      )
    ) {
      return forbiddenResponse();
    }

    const action = body.action;

    const coordinator =
      body.coordinator as
        | Coordinator
        | undefined;

    const child =
      body.child as Child | undefined;

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
        await registrations.findOne({
          parish: authorizedParish,
        });

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
      // Validate registration
      // -------------------------------------------------

      const coordinators =
        (registration.coordinators ||
          []) as Coordinator[];

      const children =
        (registration.children ||
          []) as Child[];

      // A parish can submit with only coordinators,
      // only children, or both. At least one is required.
      if (
        coordinators.length === 0 &&
        children.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Please add at least one coordinator or one child before submitting.",
          },
          { status: 400 }
        );
      }

      // -------------------------------------------------
      // Generate registration number
      // -------------------------------------------------

      const parishCode =
        authorizedParish
          .replace(/[^a-zA-Z]/g, "")
          .toUpperCase()
          .slice(0, 3)
          .padEnd(3, "X");

      let registrationCode = "";

      let codeIsUnique = false;

      while (!codeIsUnique) {
        const randomNumber =
          Math.floor(
            100000 +
              Math.random() * 900000
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
            parish: authorizedParish,
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
          await registrations.findOne({
            parish: authorizedParish,
          });

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
          parish: authorizedParish,
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
    // CREATE DRAFT
    // =================================================

    const now = new Date();

    await registrations.createIndex(
      { parish: 1 },
      {
        unique: true,
      }
    );

    await registrations.updateOne(
      {
        parish: authorizedParish,
      },
      {
        $setOnInsert: {
          parish: authorizedParish,
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

      const existingRegistration =
        await registrations.findOne({
          parish: authorizedParish,
        });

      if (
        existingRegistration?.status ===
        "submitted"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This registration has already been submitted",
          },
          { status: 400 }
        );
      }

      await registrations.updateOne(
        {
          parish: authorizedParish,
        },
        {
          $push: {
  coordinators: coordinator as any,
},
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
            error:
              "All child details are required",
          },
          { status: 400 }
        );
      }

      const existingRegistration =
        await registrations.findOne({
          parish: authorizedParish,
        });

      if (
        existingRegistration?.status ===
        "submitted"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This registration has already been submitted",
          },
          { status: 400 }
        );
      }

      await registrations.updateOne(
        {
          parish: authorizedParish,
        },
        {
          $push: {
  children: child as any,
},
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
        parish: authorizedParish,
      });

    return NextResponse.json({
      success: true,
      registration,
      parish: authorizedParish,
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

    const authorizedParish =
      await getAuthorizedParish();

    if (!authorizedParish) {
      return unauthorizedResponse();
    }

    if (
      !checkRequestedParish(
        body.parish,
        authorizedParish
      )
    ) {
      return forbiddenResponse();
    }

    const type = body.type;
    const id = body.id;
    const index = body.index;
    const data = body.data;

    if (
      !type ||
      (id === undefined && index === undefined) ||
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
        parish: authorizedParish,
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

    // -------------------------------------------------
    // Don't allow editing after final submission
    // -------------------------------------------------

    if (
      registration.status === "submitted"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This registration has already been submitted",
        },
        { status: 400 }
      );
    }

    // =================================================
    // EDIT COORDINATOR
    // =================================================

    if (type === "coordinator") {
      const coordinators =
        (registration.coordinators ||
          []) as Coordinator[];

      const updatedCoordinators =
        coordinators.map((item, itemIndex) => {
          const matches =
            id !== undefined
              ? String(item.id) === String(id)
              : Number(index) === itemIndex;

          if (matches) {
            return {
              ...item,
              name:
                data.name ?? item.name,
              mobile:
                data.mobile ?? item.mobile,
              email:
                data.email ?? item.email,
            };
          }

          return item;
        });

      await registrations.updateOne(
        {
          parish: authorizedParish,
        },
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
        children.map((item, itemIndex) => {
          const matches =
            id !== undefined
              ? String(item.id) === String(id)
              : Number(index) === itemIndex;

          if (matches) {
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
        {
          parish: authorizedParish,
        },
        {
          $set: {
            children: updatedChildren,
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

    const updatedRegistration =
      await registrations.findOne({
        parish: authorizedParish,
      });

    return NextResponse.json({
      success: true,
      registration: updatedRegistration,
      parish: authorizedParish,
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

    const authorizedParish =
      await getAuthorizedParish();

    if (!authorizedParish) {
      return unauthorizedResponse();
    }

    if (
      !checkRequestedParish(
        body.parish,
        authorizedParish
      )
    ) {
      return forbiddenResponse();
    }

    const type = body.type;
    const id = body.id;
    const index = body.index;

    if (
      !type ||
      (id === undefined && index === undefined)
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
        parish: authorizedParish,
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

    // -------------------------------------------------
    // Don't allow deletion after final submission
    // -------------------------------------------------

    if (
      registration.status === "submitted"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This registration has already been submitted",
        },
        { status: 400 }
      );
    }

    // =================================================
    // DELETE COORDINATOR
    // =================================================

    if (type === "coordinator") {
      const coordinators =
        (registration.coordinators ||
          []) as Coordinator[];

      const updatedCoordinators =
        id !== undefined
          ? coordinators.filter(
              (item) =>
                String(item.id) !==
                String(id)
            )
          : coordinators.filter(
              (_, itemIndex) =>
                itemIndex !== Number(index)
            );

      await registrations.updateOne(
        {
          parish: authorizedParish,
        },
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
        id !== undefined
          ? children.filter(
              (item) =>
                String(item.id) !==
                String(id)
            )
          : children.filter(
              (_, itemIndex) =>
                itemIndex !== Number(index)
            );

      await registrations.updateOne(
        {
          parish: authorizedParish,
        },
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

    const updatedRegistration =
      await registrations.findOne({
        parish: authorizedParish,
      });

    return NextResponse.json({
      success: true,
      registration: updatedRegistration,
      parish: authorizedParish,
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