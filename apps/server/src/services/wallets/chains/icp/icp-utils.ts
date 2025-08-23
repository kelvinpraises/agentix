import { IDL } from "@icp-sdk/core/candid";
import { Secp256k1KeyIdentity } from "@icp-sdk/core/identity/secp256k1";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { PrivyClient } from "@privy-io/server-auth";

export interface ICPIdentityResult {
  identity: Secp256k1KeyIdentity;
  principal: string;
}

export interface OrbWallet {
  orbId: string;
  principal: string;
  identity: Secp256k1KeyIdentity;
}

export async function getBaseEntropy(
  orbId: string,
  identityId: number,
  internalSalt: string,
  privyWalletAddress: string,
  privyClient: PrivyClient
): Promise<Uint8Array> {
  // Create deterministic salt like MSQ does
  const saltString = `\x0aicp-orb-wallet\n${orbId}\n${identityId}\n${internalSalt}`;
  const saltHash = sha256(new TextEncoder().encode(saltString));

  // TODO: use the raw sign instead of the eth sign message
  // Use Privy to sign this salt hash - this gives us consistent entropy
  const entropyHex = await privyClient.walletApi.ethereum.signMessage({
    walletId: privyWalletAddress, // This needs to be the actual wallet ID
    message: "0x" + bytesToHex(saltHash),
  });

  return hexToBytes(entropyHex.signature.slice(2)); // Remove 0x prefix
}

export async function getEntropy(
  orbId: string,
  identityId: number,
  internalSalt: string,
  externalSalt: Uint8Array,
  privyWalletAddress: string,
  privyClient: PrivyClient
): Promise<ArrayBuffer> {
  const baseEntropy = await getBaseEntropy(
    orbId,
    identityId,
    internalSalt,
    privyWalletAddress,
    privyClient
  );

  const entropyPreBytes = new Uint8Array([...baseEntropy, ...externalSalt]);
  return await crypto.subtle.digest("SHA-256", entropyPreBytes);
}

export async function getOrbSignIdentity(
  orbId: string,
  privyWalletAddress: string,
  privyClient: PrivyClient,
  identityId: number = 0,
  salt: Uint8Array = new Uint8Array()
): Promise<ICPIdentityResult> {
  const entropy = await getEntropy(
    orbId,
    identityId,
    "identity-sign\nshared",
    salt,
    privyWalletAddress,
    privyClient
  );

  // Create 32-byte entropy for secp256k1
  const entropy32 = new Uint8Array(entropy.slice(0, 32));

  const identity = Secp256k1KeyIdentity.fromSecretKey(entropy32);

  return {
    identity,
    principal: identity.getPrincipal().toText(),
  };
}

export function parseICPAmount(amount: string, decimals: number): bigint {
  const amountFloat = parseFloat(amount);
  return BigInt(Math.floor(amountFloat * 10 ** decimals));
}

// ICRC-1 Candid schema
export const ICRC1_TRANSFER_ARGS_SCHEMA = IDL.Record({
  from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  to: IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  }),
  amount: IDL.Nat,
  fee: IDL.Opt(IDL.Nat),
  memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
  created_at_time: IDL.Opt(IDL.Nat64),
});
