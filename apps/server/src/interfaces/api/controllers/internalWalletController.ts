import { Request, Response } from 'express';
import { db } from '../../../infrastructure/database/index.js';
import { walletService } from '../../../services/wallets/wallet-service.js';

interface WalletConfig {
  orbId: number;
  sectorId: number;
  chain: string;
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any[];
  id: number | string;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number | string;
}

/**
 * POST /internal/wallet/rpc
 * JSON-RPC 2.0 endpoint for wallet operations
 */
export const walletRpc = async (req: Request, res: Response) => {
  const rpcRequest = req.body as JsonRpcRequest;

  // Validate JSON-RPC format
  if (rpcRequest.jsonrpc !== '2.0' || !rpcRequest.method || rpcRequest.id === undefined) {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Invalid Request',
      },
      id: null,
    });
  }

  try {
    // First param is always the wallet config
    const config = rpcRequest.params?.[0] as WalletConfig;
    if (!config || !config.orbId || !config.sectorId || !config.chain) {
      return res.json({
        jsonrpc: '2.0',
        error: {
          code: -32602,
          message: 'Invalid params: Missing wallet config',
        },
        id: rpcRequest.id,
      });
    }

    // Verify orb ownership
    const orb = await db
      .selectFrom('orbs')
      .innerJoin('sectors', 'sectors.id', 'orbs.sector_id')
      .select(['orbs.id', 'orbs.chain', 'sectors.user_id'])
      .where('orbs.id', '=', config.orbId)
      .where('orbs.sector_id', '=', config.sectorId)
      .where('orbs.chain', '=', config.chain)
      .executeTakeFirst();

    if (!orb) {
      return res.json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Orb not found or access denied',
        },
        id: rpcRequest.id,
      });
    }

    // Route to appropriate handler
    const result = await handleWalletMethod(rpcRequest.method, config, rpcRequest.params?.slice(1) || []);

    return res.json({
      jsonrpc: '2.0',
      result,
      id: rpcRequest.id,
    });
  } catch (error: any) {
    console.error('Wallet RPC error:', error);
    return res.json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error.message,
      },
      id: rpcRequest.id,
    });
  }
};

/**
 * Handle wallet method calls
 */
async function handleWalletMethod(method: string, config: WalletConfig, params: any[]): Promise<any> {
  const { orbId, chain } = config;

  switch (method) {
    case 'wallet_getAddress': {
      const wallet = await walletService.getOrCreateWallet(orbId, chain);
      return wallet.address;
    }

    case 'wallet_getBalance': {
      // TODO: Implement balance fetching based on chain
      // For now, return placeholder
      throw new Error('wallet_getBalance not yet implemented');
    }

    case 'wallet_getTokenBalance': {
      const [tokenAddress] = params;
      if (!tokenAddress) {
        throw new Error('Missing tokenAddress parameter');
      }
      // TODO: Implement token balance fetching
      throw new Error('wallet_getTokenBalance not yet implemented');
    }

    case 'wallet_sendTransaction': {
      const [transaction] = params;
      if (!transaction) {
        throw new Error('Missing transaction parameter');
      }
      // TODO: Implement transaction signing and sending
      throw new Error('wallet_sendTransaction not yet implemented');
    }

    case 'wallet_signTransaction': {
      const [transaction] = params;
      if (!transaction) {
        throw new Error('Missing transaction parameter');
      }
      // TODO: Implement transaction signing
      throw new Error('wallet_signTransaction not yet implemented');
    }

    case 'wallet_getTransaction': {
      const [txHash] = params;
      if (!txHash) {
        throw new Error('Missing txHash parameter');
      }
      // TODO: Implement transaction status fetching
      throw new Error('wallet_getTransaction not yet implemented');
    }

    case 'wallet_estimateGas': {
      const [transaction] = params;
      if (!transaction) {
        throw new Error('Missing transaction parameter');
      }
      // TODO: Implement gas estimation for EVM chains
      throw new Error('wallet_estimateGas not yet implemented');
    }

    case 'wallet_getGasPrice': {
      // TODO: Implement gas price fetching for EVM chains
      throw new Error('wallet_getGasPrice not yet implemented');
    }

    case 'wallet_getChainInfo': {
      // TODO: Implement chain info fetching (block number, slot, etc.)
      throw new Error('wallet_getChainInfo not yet implemented');
    }

    default:
      throw new Error(`Unknown method: ${method}`);
  }
}
