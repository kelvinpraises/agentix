import { strategyQueue } from "@/config/queue-config";
import { db } from "@/database/turso-connection";
import {
  JournalEntryContent,
  JournalEntryType,
  UserActionContent,
  UserFeedbackContent,
} from "@/types/journal";

// == Trade Action Functions ==

// Helper function to get sector ID from trade action
export const getSectorIdFromTradeAction = async (tradeActionId: number) => {
  const result = await db
    .selectFrom("trade_actions")
    .innerJoin("orbs", "orbs.id", "trade_actions.orb_id")
    .where("trade_actions.id", "=", tradeActionId)
    .select("orbs.sector_id")
    .executeTakeFirst();
  
  return result?.sector_id;
};

// Get trades by sector
export const getTradesBySector = async (sectorId: number, userId: number) => {
  return await db
    .selectFrom("trade_actions")
    .innerJoin("orbs", "orbs.id", "trade_actions.orb_id")
    .innerJoin("sectors", "sectors.id", "orbs.sector_id")
    .where("sectors.id", "=", sectorId)
    .where("sectors.user_id", "=", userId)
    .select([
      "trade_actions.id",
      "trade_actions.orb_id",
      "trade_actions.trade_type", 
      "trade_actions.status",
      "trade_actions.is_active",
      "trade_actions.summary",
      "trade_actions.created_at",
      "trade_actions.updated_at",
      "orbs.name as orb_name",
      "orbs.chain as orb_chain"
    ])
    .orderBy("trade_actions.created_at", "desc")
    .execute();
};

// Get trades by orb
export const getTradesByOrb = async (orbId: number, userId: number) => {
  return await db
    .selectFrom("trade_actions")
    .innerJoin("orbs", "orbs.id", "trade_actions.orb_id")
    .innerJoin("sectors", "sectors.id", "orbs.sector_id")
    .where("trade_actions.orb_id", "=", orbId)
    .where("sectors.user_id", "=", userId)
    .select([
      "trade_actions.id",
      "trade_actions.orb_id",
      "trade_actions.trade_type",
      "trade_actions.status", 
      "trade_actions.is_active",
      "trade_actions.summary",
      "trade_actions.created_at",
      "trade_actions.updated_at"
    ])
    .orderBy("trade_actions.created_at", "desc")
    .execute();
};

export const startNewTradeAction = async (
  orbId: number,
  tradeType: "buy" | "sell" | "swap"
) => {
  return await db
    .insertInto("trade_actions")
    .values({
      orb_id: orbId,
      trade_type: tradeType,
      status: "ANALYZING", // Start in the new 'ANALYZING' state
      is_active: true,
    })
    .returning("id")
    .executeTakeFirstOrThrow();
};

export const getTradeActionById = async (tradeActionId: number, userId: number) => {
  // Join with orbs and sectors to verify user ownership
  return await db
    .selectFrom("trade_actions")
    .innerJoin("orbs", "orbs.id", "trade_actions.orb_id")
    .innerJoin("sectors", "sectors.id", "orbs.sector_id")
    .where("trade_actions.id", "=", tradeActionId)
    .where("sectors.user_id", "=", userId)
    .select([
      "trade_actions.id",
      "trade_actions.orb_id", 
      "trade_actions.trade_type",
      "trade_actions.status",
      "trade_actions.is_active",
      "trade_actions.summary",
      "trade_actions.created_at",
      "trade_actions.updated_at"
    ])
    .executeTakeFirst();
};

export const updateTradeStatus = async (
  tradeActionId: number,
  status:
    | "ANALYZING"
    | "PENDING_USER_ACTION"
    | "USER_INTERVENED"
    | "APPROVED"
    | "REJECTED"
    | "EXECUTING"
    | "SUCCEEDED"
    | "FAILED"
) => {
  const isActive = !["REJECTED", "SUCCEEDED", "FAILED", "USER_INTERVENED"].includes(status);

  return await db
    .updateTable("trade_actions")
    .set({ status, is_active: isActive, updated_at: new Date().toISOString() })
    .where("id", "=", tradeActionId)
    .execute();
};

// == Journal Entry Functions ==

export const createJournalEntry = async <T extends JournalEntryType>({
  sectorId,
  tradeActionId,
  type,
  content,
  metadata,
  confidenceScore,
  isInternal = false,
}: {
  sectorId: number;
  tradeActionId?: number;
  type: T;
  content: Extract<JournalEntryContent, { contentType: T }>;
  metadata?: Record<string, any>;
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
      metadata: metadata ? JSON.stringify(metadata) : null,
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

export const addUserAction = async (
  userId: number,
  tradeActionId: number,
  content: UserActionContent
) => {
  // Get sector ID from trade action
  const sectorId = await getSectorIdFromTradeAction(tradeActionId);
  if (!sectorId) {
    throw new Error("Trade action not found or invalid");
  }

  // Automatically update the parent trade action's status
  if (content.action_type === "approve") {
    await updateTradeStatus(tradeActionId, "APPROVED");
  } else if (content.action_type === "reject") {
    await updateTradeStatus(tradeActionId, "REJECTED");
  }

  return createJournalEntry({
    sectorId,
    tradeActionId,
    type: "USER_ACTION",
    content,
  });
};

export const interruptTradeAction = async (userId: number, tradeActionId: number) => {
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

  await updateTradeStatus(tradeActionId, "USER_INTERVENED");

  return createJournalEntry({
    sectorId,
    tradeActionId,
    type: "SYSTEM_ALERT",
    content: {
      contentType: "SYSTEM_ALERT",
      message: "AI analysis was interrupted by the user.",
      alert_type: "info",
      severity: "low",
      requires_action: true,
    },
  });
};

export const addUserFeedback = async (
  userId: number,
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

// == System/AI Journal Functions (for internal use) ==

export const addAIAnalysis = async (
  userId: number,
  tradeActionId: number,
  content: Extract<JournalEntryContent, { contentType: "AI_ANALYSIS" }>
) => {
  // Get sector ID from trade action
  const sectorId = await getSectorIdFromTradeAction(tradeActionId);
  if (!sectorId) {
    throw new Error("Trade action not found or invalid");
  }

  return createJournalEntry({
    sectorId,
    tradeActionId,
    type: "AI_ANALYSIS",
    content,
    isInternal: true,
  });
};

export const addAIDecision = async (
  userId: number,
  tradeActionId: number,
  content: Extract<JournalEntryContent, { contentType: "AI_DECISION" }>
) => {
  // Get sector ID from trade action
  const sectorId = await getSectorIdFromTradeAction(tradeActionId);
  if (!sectorId) {
    throw new Error("Trade action not found or invalid");
  }

  return createJournalEntry({
    sectorId,
    tradeActionId,
    type: "AI_DECISION",
    content,
    isInternal: true,
  });
};