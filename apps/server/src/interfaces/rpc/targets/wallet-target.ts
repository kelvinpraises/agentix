import { RpcTarget } from "capnweb";

import { db } from "@/infrastructure/database/turso-connection";
import { ChainType } from "@/types/orb";
import { IOrbData } from "@/types/wallet";
import { walletService } from "@/services/system/wallet/wallet-service";

/**
 * Wallet RPC Target
 * Routes wallet operations through wallet-service to appropriate chain handlers
 */
export class WalletTarget extends RpcTarget {
  async getAddress(config: {
    orbId: number;
    sectorId: number;
    chain: string;
  }): Promise<{ address: string; publicKey: string }> {
    const orbData = await this.getOrbData(config.orbId, config.chain as ChainType);
    const address = await walletService.getWalletAddress(orbData);

    return {
      address,
      publicKey: orbData.chain === "paper" ? address : "",
    };
  }

  async getBalance(config: {
    orbId: number;
    sectorId: number;
    chain: string;
    tokenAddress?: string;
  }): Promise<string> {
    const orbData = await this.getOrbData(config.orbId, config.chain as ChainType);
    const balance = await walletService.getBalance(orbData, config.tokenAddress);
    return balance.toString();
  }

  async signTransaction(config: {
    orbId: number;
    sectorId: number;
    chain: string;
    transaction: any;
  }): Promise<string> {
    const orbData = await this.getOrbData(config.orbId, config.chain as ChainType);
    const result = await walletService.sign(orbData, config.transaction);
    return result.signature;
  }

  async sendTransaction(config: {
    orbId: number;
    sectorId: number;
    chain: string;
    transaction: any;
  }): Promise<string> {
    const orbData = await this.getOrbData(config.orbId, config.chain as ChainType);
    const result = await walletService.transfer(orbData, config.transaction);
    return result.transactionHash || "";
  }

  async signMessage(_config: {
    orbId: number;
    sectorId: number;
    chain: string;
    message: string;
  }): Promise<string> {
    throw new Error("wallet_signMessage not yet implemented");
  }

  private async getOrbData(orbId: number, chain: ChainType): Promise<IOrbData> {
    const orb = await db
      .selectFrom("orbs")
      .selectAll()
      .where("id", "=", orbId)
      .executeTakeFirstOrThrow();

    const sector = await db
      .selectFrom("sectors")
      .select(["type"])
      .where("id", "=", orb.sector_id)
      .executeTakeFirstOrThrow();

    return {
      id: orb.id.toString(),
      chain,
      wallet_address: orb.wallet_address,
      privy_wallet_id: orb.privy_wallet_id || "",
      sectorType: sector.type,
    };
  }
}
