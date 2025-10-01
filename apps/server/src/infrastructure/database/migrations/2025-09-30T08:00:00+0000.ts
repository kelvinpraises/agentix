import { Kysely, sql } from "kysely";
import { DB } from "../schema";

export async function up(db: Kysely<DB>): Promise<void> {
  // Users table
  await db.schema
    .createTable("users")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("email", "text", (col) => col.notNull().unique())
    .addColumn("password_hash", "text", (col) => col.notNull())
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("updated_at", "text")
    .execute();

  // Sectors table
  await db.schema
    .createTable("sectors")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("user_id", "integer", (col) =>
      col.notNull().references("users.id").onDelete("cascade")
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("type", "text", (col) =>
      col.notNull().check(sql`type IN ('live_trading', 'paper_trading')`)
    )
    .addColumn("settings", "text") // JSON stored as TEXT
    .addColumn("active_policy_version", "integer")
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("updated_at", "text")
    .execute();

  // Sector policies table
  await db.schema
    .createTable("sector_policies")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("sector_id", "integer", (col) =>
      col.notNull().references("sectors.id").onDelete("cascade")
    )
    .addColumn("policy_document", "text", (col) => col.notNull()) // JSON
    .addColumn("version", "integer", (col) => col.notNull())
    .addColumn("is_active", "integer", (col) => col.notNull().defaultTo(0)) // SQLite boolean as 0/1
    .addColumn("ai_critique", "text")
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  await db.schema
    .createIndex("sector_policies_active_idx")
    .on("sector_policies")
    .columns(["sector_id", "is_active"])
    .execute();

  // Orbs table
  await db.schema
    .createTable("orbs")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("sector_id", "integer", (col) =>
      col.notNull().references("sectors.id").onDelete("cascade")
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("chain", "text", (col) =>
      col
        .notNull()
        .check(sql`chain IN ('ethereum', 'solana', 'sei', 'hyperliquid', 'icp', 'paper')`)
    )
    .addColumn("wallet_address", "text", (col) => col.notNull())
    .addColumn("privy_wallet_id", "text", (col) => col.notNull())
    .addColumn("asset_pairs", "text", (col) => col.notNull()) // JSON
    .addColumn("config_json", "text") // JSON
    .addColumn("context", "text")
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("updated_at", "text")
    .execute();

  // Threads table
  await db.schema
    .createTable("threads")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("orb_id", "integer", (col) =>
      col.notNull().references("orbs.id").onDelete("cascade")
    )
    .addColumn("type", "text", (col) =>
      col
        .notNull()
        .check(
          sql`type IN ('dex', 'bridge', 'lending', 'yield_farming', 'network_infra', 'other')`
        )
    )
    .addColumn("provider_id", "text", (col) => col.notNull())
    .addColumn("enabled", "integer", (col) => col.notNull().defaultTo(1)) // boolean
    .addColumn("config_json", "text", (col) => col.notNull()) // JSON
    .addColumn("description", "text")
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("updated_at", "text")
    .execute();

  // Trade actions table
  await db.schema
    .createTable("trade_actions")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("sector_id", "integer", (col) =>
      col.notNull().references("sectors.id").onDelete("cascade")
    )
    .addColumn("orb_id", "integer", (col) => col.references("orbs.id"))
    .addColumn("trading_pair", "text")
    .addColumn("status", "text", (col) =>
      col
        .notNull()
        .check(sql`status IN ('ANALYZING', 'REJECTED', 'EXECUTING', 'SUCCEEDED', 'FAILED')`)
    )
    .addColumn("is_active", "integer", (col) => col.notNull().defaultTo(1)) // boolean
    .addColumn("summary", "text")
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("updated_at", "text")
    .execute();

  // Trade strategies table
  await db.schema
    .createTable("trade_strategies")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("trade_action_id", "integer", (col) =>
      col.notNull().references("trade_actions.id").onDelete("cascade")
    )
    .addColumn("strategy_type", "text", (col) => col.notNull())
    .addColumn("strategy_params_json", "text", (col) => col.notNull()) // JSON
    .addColumn("is_active", "integer", (col) => col.notNull().defaultTo(1)) // boolean
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  // Journal entries table
  await db.schema
    .createTable("journal_entries")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("sector_id", "integer", (col) =>
      col.notNull().references("sectors.id").onDelete("cascade")
    )
    .addColumn("trade_action_id", "integer", (col) =>
      col.references("trade_actions.id").onDelete("cascade")
    )
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("content", "text", (col) => col.notNull()) // JSON
    .addColumn("confidence_score", "real")
    .addColumn("is_internal", "integer", (col) => col.notNull().defaultTo(0)) // boolean
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  // Portfolio snapshots table
  await db.schema
    .createTable("portfolio_snapshots")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("sector_id", "integer", (col) =>
      col.notNull().references("sectors.id").onDelete("cascade")
    )
    .addColumn("total_value", "real", (col) => col.notNull())
    .addColumn("total_pnl", "real", (col) => col.notNull())
    .addColumn("pnl_percentage", "real", (col) => col.notNull())
    .addColumn("vs_inflation_performance", "real")
    .addColumn("snapshot_date", "text", (col) => col.notNull())
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  // Thread network storage table (sector-scoped, shared across orbs)
  await db.schema
    .createTable("thread_network_storage")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("sector_id", "integer", (col) =>
      col.notNull().references("sectors.id").onDelete("cascade")
    )
    .addColumn("chain", "text", (col) => col.notNull())
    .addColumn("provider_id", "text", (col) => col.notNull())
    .addColumn("storage_json", "text", (col) => col.notNull()) // All data as JSON
    .addColumn("updated_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  await db.schema
    .createIndex("thread_network_storage_unique_idx")
    .on("thread_network_storage")
    .columns(["sector_id", "chain", "provider_id"])
    .unique()
    .execute();

  // Thread isolated storage table (orb + provider scoped)
  await db.schema
    .createTable("thread_isolated_storage")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("orb_id", "integer", (col) =>
      col.notNull().references("orbs.id").onDelete("cascade")
    )
    .addColumn("provider_id", "text", (col) => col.notNull())
    .addColumn("storage_json", "text", (col) => col.notNull()) // All data as JSON
    .addColumn("updated_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  await db.schema
    .createIndex("thread_isolated_storage_unique_idx")
    .on("thread_isolated_storage")
    .columns(["orb_id", "provider_id"])
    .unique()
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop in reverse order to respect foreign keys
  await db.schema.dropTable("thread_isolated_storage").ifExists().execute();
  await db.schema.dropTable("thread_network_storage").ifExists().execute();
  await db.schema.dropTable("portfolio_snapshots").ifExists().execute();
  await db.schema.dropTable("journal_entries").ifExists().execute();
  await db.schema.dropTable("trade_strategies").ifExists().execute();
  await db.schema.dropTable("trade_actions").ifExists().execute();
  await db.schema.dropTable("threads").ifExists().execute();
  await db.schema.dropTable("orbs").ifExists().execute();
  await db.schema.dropTable("sector_policies").ifExists().execute();
  await db.schema.dropTable("sectors").ifExists().execute();
  await db.schema.dropTable("users").ifExists().execute();
}
