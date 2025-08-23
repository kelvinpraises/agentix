import { requestIdOf } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { Principal } from "@icp-sdk/core/principal";
import { bytesToHex } from "@noble/hashes/utils";
import { PrivyClient } from "@privy-io/server-auth";

import {
  getOrbSignIdentity,
  ICPIdentityResult,
  ICRC1_TRANSFER_ARGS_SCHEMA,
} from "@/services/wallets/chains/icp/icp-utils";
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

const IC_REQUEST_DOMAIN_SEPARATOR = new Uint8Array([
  10, 105, 99, 45, 114, 101, 113, 117, 101, 115, 116,
]);

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

async function buildAndSignICRC1Transfer({
  transferRequest,
  identityResult,
}: {
  transferRequest: IICPTransferRequest;
  identityResult: ICPIdentityResult;
}): Promise<ICPSignedTransaction> {
  const { canisterId, toAddress, amount, fee, memo } = transferRequest;

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

  // Build IC request
  const request = {
    request_type: "call" as const,
    canister_id: Principal.fromText(canisterId),
    method_name: "icrc1_transfer",
    arg,
    sender: Principal.fromText(identityResult.principal),
    ingress_expiry: BigInt(Date.now() + 5 * 60 * 1000) * BigInt(1000000), // 5 minutes
  };

  // Sign the request
  const requestId = requestIdOf(request);
  const signingPayload = concat(IC_REQUEST_DOMAIN_SEPARATOR, requestId);
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
