import { NextResponse } from "next/server";
import { getDatabase } from "../../lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();

    const collections = await db
      .listCollections()
      .toArray();

    return NextResponse.json({
      success: true,
      message: "MongoDB connection working",
      database: db.databaseName,
      collections: collections.map(
        (collection: { name: string }) => collection.name
      ),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "MongoDB connection failed",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}