import { db } from "@/database/turso-connection";
import {
  JournalEntryContent,
  JournalEntryType,
  UserActionContent,
  UserFeedbackContent,
} from "@/types/journal";
import { updateTradeStatus } from "../trading/trade-service";

// == Journal Entry Functions ==

export const createJournalEntry = async <T extends JournalEntryType>({
  userId,
  tradeActionId,
  type,
  content,
  metadata,
  confidenceScore,
  isInternal = false,
}: {
  userId: number;
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
      user_id: userId,
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
  // Automatically update the parent trade action's status
  if (content.action_type === "approve") {
    await updateTradeStatus(tradeActionId, "APPROVED");
  } else if (content.action_type === "reject") {
    await updateTradeStatus(tradeActionId, "REJECTED");
  }

  return createJournalEntry({
    userId,
    tradeActionId,
    type: "USER_ACTION",
    content,
  });
};

export const interruptTradeAction = async (userId: number, tradeActionId: number) => {
  // TODO: Implement logic to send an interrupt signal to the Mastra AI agent.
  await updateTradeStatus(tradeActionId, "USER_INTERVENED");

  return createJournalEntry({
    userId,
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
  return createJournalEntry({
    userId,
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
  return createJournalEntry({
    userId,
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
  return createJournalEntry({
    userId,
    tradeActionId,
    type: "AI_DECISION",
    content,
    isInternal: true,
  });
};
