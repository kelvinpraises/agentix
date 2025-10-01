// Binding module for storage extension
// This receives innerBindings from workerd and constructs the StorageExtension

import { StorageExtension } from 'agentix-internal:storage-impl';

interface BindingEnv {
  orbId?: string;
  sectorId?: string;
  chain?: string;
  providerId: string;
  storageScope: 'isolated' | 'network';
  apiBaseUrl?: string;
}

function makeBinding(env: BindingEnv): StorageExtension {
  return new StorageExtension(
    {
      orbId: env.orbId ? parseInt(env.orbId, 10) : undefined,
      sectorId: env.sectorId ? parseInt(env.sectorId, 10) : undefined,
      chain: env.chain,
      providerId: env.providerId,
      scope: env.storageScope,
    },
    env.apiBaseUrl
  );
}

export default makeBinding;
