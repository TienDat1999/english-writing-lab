import { connectMongoose } from "@/server/db/mongoose";

export async function GET() {
  try {
    const mongoose = await connectMongoose();
    const databaseReady = mongoose.connection.readyState === 1;

    return Response.json(
      {
        status: databaseReady ? "ok" : "degraded",
        services: { mongodb: databaseReady },
      },
      { status: databaseReady ? 200 : 503 },
    );
  } catch {
    return Response.json(
      { status: "degraded", services: { mongodb: false } },
      { status: 503 },
    );
  }
}

