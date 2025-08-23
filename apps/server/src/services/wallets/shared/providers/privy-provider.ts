import { PrivyClient } from "@privy-io/server-auth";

export function createPrivyClient(): PrivyClient {
  if (!process.env.PAID || !process.env.PAS) {
    throw new Error("Privy credentials not found in environment variables");
  }

  return new PrivyClient(process.env.PAID, process.env.PAS);
}

export function getAuthConfig() {
  if (!process.env.GENT9 || !process.env.KQID) {
    throw new Error("Privy auth config not found in environment variables");
  }

  return {
    authKeyId: process.env.GENT9,
    keyQuorumId: process.env.KQID,
  };
}
