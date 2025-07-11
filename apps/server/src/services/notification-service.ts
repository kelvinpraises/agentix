/**
 * @file Manages sending push notifications to the client to trigger wallet actions.
 *
 * This service is critical for the application's security model. Since the server
 * does not have access to user private keys, it cannot execute trades directly.
 * Instead, it sends a typed push notification to the client, which is intercepted
 * by a service worker. The service worker then initiates the secure, client-side
 * wallet action (e.g., signing a transaction).
 */

/**
 * The type of trade proposal being sent to the client. This informs the
 * service worker which wallet action to prepare.
 */
export type TradeProposalType =
  | "ENTER_POSITION"
  | "EXIT_POSITION"
  | "ADJUST_POSITION"
  | "SWAP";

/**
 * Sends a typed push notification to the client to signal a new trade proposal.
 *
 * In a real implementation, this would integrate with a push notification provider
 * like Firebase Cloud Messaging (FCM), Apple Push Notification Service (APNS),
 * or a similar service. The payload sent would be structured to be parsed by
 * the client's service worker.
 *
 * @param userId - The ID of the user to notify.
 * @param tradeActionId - The ID of the overarching trade action.
 * @param journalEntryId - The ID of the specific journal entry with proposal details.
 * @param proposalType - The specific type of trade being proposed.
 * @returns A promise that resolves with the status of the notification attempt.
 */
export const sendTradeProposal = async (
  userId: number,
  tradeActionId: number,
  journalEntryId: number,
  proposalType: TradeProposalType
): Promise<{ success: boolean; message: string }> => {
  const payload = {
    tradeActionId,
    journalEntryId,
    proposalType,
  };

  console.log(
    `[NotificationService] Pushing ${proposalType} proposal to user ${userId}.`,
    payload
  );

  // In a real implementation:
  // 1. Fetch the user's push notification token from the database.
  // 2. Send the payload to the push notification service (e.g., FCM).
  // 3. The service worker on the client device receives the push notification.
  // 4. The service worker uses the payload to fetch details and prompt the user
  //    or handle the wallet action.

  return {
    success: true,
    message: `Push notification for ${proposalType} sent successfully.`,
  };
};