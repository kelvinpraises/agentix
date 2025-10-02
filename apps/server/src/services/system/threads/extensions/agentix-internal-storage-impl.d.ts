declare module 'agentix-internal:storage-impl' {
  interface StorageConfig {
    orbId?: number;
    sectorId?: number;
    chain?: string;
    providerId: string;
    scope: 'isolated' | 'network';
  }

  export class StorageExtension {
    constructor(config: StorageConfig, apiBaseUrl?: string);
    get(): Promise<any | null>;
    set(data: any): Promise<void>;
    delete(): Promise<void>;
  }
}
