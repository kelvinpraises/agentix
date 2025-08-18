import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

import { DB } from "@/database/schema";

const dialect = new SqliteDialect({
  database: new Database(process.env.DATABASE_URL || "mastara.db"),
});

export const db = new Kysely<DB>({
  dialect,
});
