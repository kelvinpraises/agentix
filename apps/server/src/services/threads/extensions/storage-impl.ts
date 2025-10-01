// Internal implementation of storage extension
// Handles scoped storage operations with HTTP calls to Agentix API

interface StorageConfig {
  orbId?: number;
  sectorId?: number;
  chain?: string;
  providerId: string;
  scope: 'isolated' | 'network';
}

export class StorageExtension {
  #config: StorageConfig;
  #apiBaseUrl: string;

  constructor(config: StorageConfig, apiBaseUrl = 'http://localhost:3000') {
    this.#config = config;
    this.#apiBaseUrl = apiBaseUrl;

    // Validate scoping requirements
    if (config.scope === 'isolated' && !config.orbId) {
      throw new Error('Isolated storage requires orbId');
    }
    if (config.scope === 'network' && (!config.sectorId || !config.chain)) {
      throw new Error('Network storage requires sectorId and chain');
    }
  }

  /**
   * Get the entire storage_json for this scoped entity
   * Returns null if no storage exists yet
   */
  async get(): Promise<any | null> {
    const url = `${this.#apiBaseUrl}/internal/storage/${this.#config.scope}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Storage-Config': JSON.stringify(this.#config),
      },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Storage get failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return data.storage;
  }

  /**
   * Set the entire storage_json for this scoped entity
   * Replaces any existing data
   */
  async set(data: any): Promise<void> {
    const url = `${this.#apiBaseUrl}/internal/storage/${this.#config.scope}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: this.#config,
        data,
      }),
    });

    if (!res.ok) {
      throw new Error(`Storage set failed: ${res.status} ${await res.text()}`);
    }
  }

  /**
   * Delete storage for this scoped entity
   */
  async delete(): Promise<void> {
    const url = `${this.#apiBaseUrl}/internal/storage/${this.#config.scope}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Storage-Config': JSON.stringify(this.#config),
      },
    });

    if (!res.ok) {
      throw new Error(`Storage delete failed: ${res.status} ${await res.text()}`);
    }
  }
}
