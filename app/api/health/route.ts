import { sql } from "drizzle-orm";
import { getDb } from "../../../db";

export async function GET() {
  try {
    const db = getDb();
    await db.run(sql`select 1`);
    return Response.json({ status: "ok", database: "connected" });
  } catch {
    return Response.json(
      {
        status: "ok",
        database: "not-configured",
        message: "O servidor está ativo, mas o banco D1 ainda não foi configurado.",
      },
      { status: 200 },
    );
  }
}