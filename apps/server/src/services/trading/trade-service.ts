import { strategyQueue } from "@/infrastructure/queues/definitions";
import { db } from "@/infrastructure/database/turso-connection";
import {
  JournalEntryContent,
  JournalEntryType,
  UserActionContent,
  UserFeedbackContent,
} from "@/types/journal";

// == Trade Action Functions ==

// Get full trade action details
export const getTradeAction = async (tradeActionId: number) => {
  return await db
    .selectFrom("trade_actions")
    .where("id", "=", tradeActionId)
    .selectAll()
    .executeTakeFirst();
};

// Helper function to get sector ID from trade action
export const getSectorIdFromTradeAction = async (tradeActionId: number) => {
  const result = await db
    .selectFrom("trade_actions")
    .where("trade_actions.id", "=", tradeActionId)
    .select("trade_actions.sector_id")
    .executeTakeFirst();

  return result?.sector_id;
};

// Get execution journal entry for a trade
export const getExecutionJournalEntry = async (tradeActionId: number) => {
  return await db
    .selectFrom("journal_entries")
    .where("trade_action_id", "=", tradeActionId)
    .where("type", "=", "POSITION_ENTERED")
    .orderBy("created_at", "desc")
    .select(["content"])
    .executeTakeFirst();
};

// Get sector with user information
export const getSectorWithUser = async (sectorId: number) => {
  return await db
    .selectFrom("sectors")
    .where("id", "=", sectorId)
    .select(["id", "user_id", "name", "type"])
    .executeTakeFirst();
};

// Get trades by sector
export const getTradesBySector = async (sectorId: number, userId: number) => {
  return await db
    .selectFrom("trade_actions")
    .innerJoin("sectors", "sectors.id", "trade_actions.sector_id")
    .where("sectors.id", "=", sectorId)
    .where("sectors.user_id", "=", userId)
    .select([
      "trade_actions.id",
      "trade_actions.sector_id",
      "trade_actions.status",
      "trade_actions.is_active",
      "trade_actions.summary",
      "trade_actions.created_at",
      "trade_actions.updated_at",
    ])
    .orderBy("trade_actions.created_at", "desc")
    .execute();
};

export const startNewTradeAction = async (sectorId: number) => {
  return await db
    .insertInto("trade_actions")
    .values({
      sector_id: sectorId,
      status: "ANALYZING", // Start in the new 'ANALYZING' state
      is_active: true,
    })
    .returning("id")
    .executeTakeFirstOrThrow();
};

export const getTradeActionById = async (tradeActionId: number, userId: number) => {
  // Join with sectors to verify user ownership
  return await db
    .selectFrom("trade_actions")
    .innerJoin("sectors", "sectors.id", "trade_actions.sector_id")
    .where("trade_actions.id", "=", tradeActionId)
    .where("sectors.user_id", "=", userId)
    .select([
      "trade_actions.id",
      "trade_actions.sector_id",
      "trade_actions.status",
      "trade_actions.is_active",
      "trade_actions.summary",
      "trade_actions.created_at",
      "trade_actions.updated_at",
    ])
    .executeTakeFirst();
};

export const updateTradeStatus = async (
  tradeActionId: number,
  status: "ANALYZING" | "REJECTED" | "EXECUTING" | "SUCCEEDED" | "FAILED"
) => {
  const isActive = !["REJECTED", "SUCCEEDED", "FAILED"].includes(status);

  return await db
    .updateTable("trade_actions")
    .set({ status, is_active: isActive, updated_at: new Date().toISOString() })
    .where("id", "=", tradeActionId)
    .execute();
};

// == Journal Entry Functions ==

export const createJournalEntry = async ({
  sectorId,
  tradeActionId,
  type,
  content,
  confidenceScore,
  isInternal = false,
}: {
  sectorId: number;
  tradeActionId?: number;
  type: JournalEntryType;
  content: JournalEntryContent;
  confidenceScore?: number;
  isInternal?: boolean;
}) => {
  return await db
    .insertInto("journal_entries")
    .values({
      sector_id: sectorId,
      trade_action_id: tradeActionId,
      type,
      content: JSON.stringify(content),
      confidence_score: confidenceScore,
      is_internal: isInternal,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const getJournalForTradeAction = async (
  tradeActionId: number,
  includeInternal = false
) => {
  let query = db
    .selectFrom("journal_entries")
    .where("trade_action_id", "=", tradeActionId)
    .orderBy("created_at", "asc");

  if (!includeInternal) {
    query = query.where("is_internal", "=", false);
  }

  return await query.selectAll().execute();
};

// == User Interaction Journal Functions ==

export const addUserAction = async (tradeActionId: number, content: UserActionContent) => {
  // Get sector ID from trade action
  const sectorId = await getSectorIdFromTradeAction(tradeActionId);
  if (!sectorId) {
    throw new Error("Trade action not found or invalid");
  }

  // Automatically update the parent trade action's status
  if (content.action_type === "approve_trade") {
    await updateTradeStatus(tradeActionId, "EXECUTING");
  } else if (content.action_type === "reject_trade") {
    await updateTradeStatus(tradeActionId, "REJECTED");
  }

  return createJournalEntry({
    sectorId,
    tradeActionId,
    type: "USER_ACTION",
    content,
  });
};

export const interruptTradeAction = async (tradeActionId: number) => {
  const schedulerId = `monitor-trade-${tradeActionId}`;

  // Get sector ID from trade action
  const sectorId = await getSectorIdFromTradeAction(tradeActionId);
  if (!sectorId) {
    throw new Error("Trade action not found or invalid");
  }

  try {
    await strategyQueue.removeJobScheduler(schedulerId);
    console.log(
      `[trade-service] Removed job scheduler ${schedulerId} for interrupted trade action ${tradeActionId}.`
    );
  } catch (error) {
    console.error(
      `[trade-service] Failed to remove job scheduler for key ${schedulerId}:`,
      error
    );
    // Continue even if removal fails, to ensure trade status is updated.
  }

  await updateTradeStatus(tradeActionId, "FAILED");

  return createJournalEntry({
    sectorId,
    tradeActionId,
    type: "SYSTEM_ALERT",
    content: {
      message: "AI analysis was interrupted by the user.",
      alert_type: "info",
      severity: "low",
      requires_action: true,
    },
  });
};

export const addUserFeedback = async (
  tradeActionId: number,
  content: UserFeedbackContent
) => {
  // Get sector ID from trade action
  const sectorId = await getSectorIdFromTradeAction(tradeActionId);
  if (!sectorId) {
    throw new Error("Trade action not found or invalid");
  }

  // TODO: send message to the Mastra AI agent to update its model with this feedback.

  return createJournalEntry({
    sectorId,
    tradeActionId,
    type: "USER_FEEDBACK",
    content,
  });
};
