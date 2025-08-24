import { requestIdOf } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { Principal } from "@icp-sdk/core/principal";
import { bytesToHex } from "@noble/hashes/utils";
import { PrivyClient } from "@privy-io/server-auth";

import {
  getOrbSignIdentity,
  ICPIdentityResult,
  ICRC1_TRANSFER_ARGS_SCHEMA,
  IC_DOMAIN_SEPARATOR,
  prepareRequest,
  ICRC1_BALANCE_ARGS_SCHEMA,
} from "@/services/wallets/chains/icp/icp-utils";
import {
  icAgent,
  ICNetworkError,
  parseICRC1TransferResponse,
  parseICRC1BalanceResponse,
} from "@/services/wallets/chains/icp/ic-agent";
import {
  TransactionSigningError,
  WalletGenerationError,
} from "@/services/wallets/shared/errors";
import {
  IICPTransferRequest,
  ISignatureResult,
  IWalletGenerationResult,
} from "@/types/wallet";

export interface ICPSignedTransaction {
  request: any;
  signature: Uint8Array;
  requestId: string;
  signedRequest: any;
}


function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

const orbWalletCache = new Map<string, ICPIdentityResult>();

export async function generateICPWallet(
  orbId: string,
  privyWalletAddress: string,
  privyClient: PrivyClient
): Promise<IWalletGenerationResult> {
  try {
    const identityResult = await getOrbSignIdentity(orbId, privyWalletAddress, privyClient);

    // Cache the identity for reuse
    orbWalletCache.set(orbId, identityResult);

    return {
      address: identityResult.principal,
      chainType: "icp",
    };
  } catch (error) {
    throw new WalletGenerationError(
      `Failed to generate ICP wallet for orb ${orbId}: ${error}`,
      "icp",
      orbId
    );
  }
}

export async function getICPWalletAddress(
  orbId: string,
  privyWalletAddress: string,
  privyClient: PrivyClient
): Promise<string> {
  // Check cache first
  const cached = orbWalletCache.get(orbId);
  if (cached) {
    return cached.principal;
  }

  // Generate if not cached
  const identityResult = await getOrbSignIdentity(orbId, privyWalletAddress, privyClient);
  orbWalletCache.set(orbId, identityResult);

  return identityResult.principal;
}

export async function signICPTransaction(
  orbId: string,
  transferRequest: IICPTransferRequest,
  privyWalletAddress: string,
  privyClient: PrivyClient
): Promise<ISignatureResult> {
  try {
    // Get or create identity
    let identityResult = orbWalletCache.get(orbId);
    if (!identityResult) {
      identityResult = await getOrbSignIdentity(orbId, privyWalletAddress, privyClient);
      orbWalletCache.set(orbId, identityResult);
    }

    const signedTransaction = await buildAndSignICRC1Transfer({
      transferRequest,
      identityResult,
    });

    return {
      signature: bytesToHex(signedTransaction.signature),
      transactionHash: signedTransaction.requestId,
      encoding: "candid",
    };
  } catch (error) {
    throw new TransactionSigningError(
      `Failed to sign ICP transaction for orb ${orbId}: ${error}`,
      "icp",
      orbId
    );
  }
}

export async function executeICPTransfer(
  orbId: string,
  transferRequest: IICPTransferRequest,
  privyWalletAddress: string,
  privyClient: PrivyClient
): Promise<{ transactionIndex: bigint; requestId: string }> {
  try {
    // Get or create identity
    let identityResult = orbWalletCache.get(orbId);
    if (!identityResult) {
      identityResult = await getOrbSignIdentity(orbId, privyWalletAddress, privyClient);
      orbWalletCache.set(orbId, identityResult);
    }

    // Build and sign transaction
    const signedTransaction = await buildAndSignICRC1Transfer({
      transferRequest,
      identityResult,
    });

    // Submit to IC network
    const response = await icAgent.submitCall({
      body: {
        content: signedTransaction.request as any,
        sender_pubkey: identityResult.identity.getPublicKey().toDer(),
        sender_sig: signedTransaction.signature,
      },
    });

    if (response.status === "rejected") {
      throw new ICNetworkError(
        `Transaction rejected: ${response.reject_message}`,
        response.reject_code,
        transferRequest.canisterId
      );
    }

    // Parse successful response
    const result = parseICRC1TransferResponse(response.reply!.arg);
    
    if (typeof result === "string") {
      throw new ICNetworkError(
        `Transfer failed: ${result}`,
        undefined,
        transferRequest.canisterId
      );
    }

    return {
      transactionIndex: result,
      requestId: signedTransaction.requestId,
    };
  } catch (error) {
    if (error instanceof ICNetworkError) {
      throw error;
    }
    throw new TransactionSigningError(
      `Failed to execute ICP transfer for orb ${orbId}: ${error}`,
      "icp",
      orbId
    );
  }
}

async function buildAndSignICRC1Transfer({
  transferRequest,
  identityResult,
}: {
  transferRequest: IICPTransferRequest;
  identityResult: ICPIdentityResult;
}): Promise<ICPSignedTransaction> {
  const { canisterId, toAddress, amount, fee, memo, expiryMinutes = 5 } = transferRequest;

  // Build transfer args
  const transferArgs = {
    from_subaccount: [],
    to: {
      owner: Principal.fromText(toAddress),
      subaccount: [],
    },
    amount,
    fee: fee ? [fee] : [],
    memo: memo ? [memo] : [],
    created_at_time: [BigInt(Date.now() * 1000000)], // nanoseconds
  };

  const arg = IDL.encode([ICRC1_TRANSFER_ARGS_SCHEMA], [transferArgs]);

  // Build IC request with flexible expiry
  const request = {
    request_type: "call" as const,
    canister_id: canisterId,
    method_name: "icrc1_transfer",
    arg,
    sender: identityResult.principal,
    ingress_expiry: BigInt(Date.now() + expiryMinutes * 60 * 1000) * BigInt(1000000),
  };

  // Prepare request and sign using MSQ pattern
  const preparedRequest = prepareRequest(request);
  const requestId = requestIdOf(preparedRequest);
  const signingPayload = concat(IC_DOMAIN_SEPARATOR, requestId);
  const signature = await identityResult.identity.sign(signingPayload);

  return {
    request,
    signature,
    requestId: bytesToHex(requestId),
    signedRequest: {
      ...request,
      body: {
        content: request,
        sender_pubkey: identityResult.identity.getPublicKey().toDer(),
        sender_sig: signature,
      },
    },
  };
}

export async function queryICRC1Balance(
  orbId: string,
  canisterId: string,
  privyWalletAddress: string,
  privyClient: PrivyClient,
  subaccount?: Uint8Array
): Promise<bigint> {
  try {
    // Get or create identity
    let identityResult = orbWalletCache.get(orbId);
    if (!identityResult) {
      identityResult = await getOrbSignIdentity(orbId, privyWalletAddress, privyClient);
      orbWalletCache.set(orbId, identityResult);
    }

    // Build balance query args
    const balanceArgs = {
      owner: Principal.fromText(identityResult.principal),
      subaccount: subaccount ? [subaccount] : [],
    };

    const arg = IDL.encode([ICRC1_BALANCE_ARGS_SCHEMA], [balanceArgs]);

    // Build IC query request
    const request = {
      request_type: "query" as const,
      canister_id: canisterId,
      method_name: "icrc1_balance_of",
      arg,
      sender: identityResult.principal,
      ingress_expiry: BigInt(Date.now() + 5 * 60 * 1000) * BigInt(1000000),
    };

    // Prepare request for signing
    const preparedRequest = prepareRequest(request);
    const requestId = requestIdOf(preparedRequest);
    const signingPayload = concat(IC_DOMAIN_SEPARATOR, requestId);
    const signature = await identityResult.identity.sign(signingPayload);

    // Submit query to IC network
    const response = await icAgent.submitQuery({
      body: {
        content: request as any,
        sender_pubkey: identityResult.identity.getPublicKey().toDer(),
        sender_sig: signature,
      },
    });

    if (response.status === "rejected") {
      throw new ICNetworkError(
        `Balance query rejected: ${response.reject_message}`,
        response.reject_code,
        canisterId
      );
    }

    // Parse and return balance
    return parseICRC1BalanceResponse(response.reply!.arg);
  } catch (error) {
    if (error instanceof ICNetworkError) {
      throw error;
    }
    throw new TransactionSigningError(
      `Failed to query ICRC-1 balance for orb ${orbId}: ${error}`,
      "icp",
      orbId
    );
  }
}
