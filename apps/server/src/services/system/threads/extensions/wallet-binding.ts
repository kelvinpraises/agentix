// Binding module for wallet extension
// This receives innerBindings from workerd and constructs the WalletExtension

import { WalletExtension } from 'agentix-internal:wallet-impl';

interface BindingEnv {
  orbId: string;
  sectorId: string;
  chain: string;
  apiBaseUrl?: string;
}

function makeBinding(env: BindingEnv): WalletExtension {
  const rpcUrl = env.apiBaseUrl || 'http://localhost:4848/rpc';

  return new WalletExtension(
    {
      orbId: parseInt(env.orbId, 10),
      sectorId: parseInt(env.sectorId, 10),
      chain: env.chain,
    },
    rpcUrl
  );
}

export default makeBinding;
