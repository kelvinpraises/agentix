import { Request, Response } from 'express';
import { db } from '../../../infrastructure/database/index.js';

interface StorageConfig {
  orbId?: number;
  sectorId?: number;
  chain?: string;
  providerId: string;
  scope: 'isolated' | 'network';
}

interface StorageSetRequest {
  config: StorageConfig;
  data: any;
}

/**
 * GET /internal/storage/:scope
 * Get storage_json for scoped entity
 */
export const getStorage = async (req: Request, res: Response) => {
  try {
    const scope = req.params.scope as 'isolated' | 'network';
    const configHeader = req.headers['x-storage-config'] as string;

    if (!configHeader) {
      return res.status(400).json({ error: 'Missing X-Storage-Config header' });
    }

    const config: StorageConfig = JSON.parse(configHeader);

    // Validate scope requirements
    if (scope === 'isolated') {
      if (!config.orbId || !config.providerId) {
        return res.status(400).json({ error: 'Isolated storage requires orbId and providerId' });
      }

      const storage = await db
        .selectFrom('thread_isolated_storage')
        .selectAll()
        .where('orb_id', '=', config.orbId)
        .where('provider_id', '=', config.providerId)
        .executeTakeFirst();

      if (!storage) {
        return res.status(404).json({ error: 'Storage not found' });
      }

      return res.json({ storage: storage.storage_json });
    } else if (scope === 'network') {
      if (!config.sectorId || !config.chain || !config.providerId) {
        return res.status(400).json({ error: 'Network storage requires sectorId, chain, and providerId' });
      }

      const storage = await db
        .selectFrom('thread_network_storage')
        .selectAll()
        .where('sector_id', '=', config.sectorId)
        .where('chain', '=', config.chain)
        .where('provider_id', '=', config.providerId)
        .executeTakeFirst();

      if (!storage) {
        return res.status(404).json({ error: 'Storage not found' });
      }

      return res.json({ storage: storage.storage_json });
    } else {
      return res.status(400).json({ error: 'Invalid scope' });
    }
  } catch (error) {
    console.error('Error getting storage:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /internal/storage/:scope
 * Set storage_json for scoped entity (upsert)
 */
export const setStorage = async (req: Request, res: Response) => {
  try {
    const scope = req.params.scope as 'isolated' | 'network';
    const { config, data }: StorageSetRequest = req.body;

    if (!config || data === undefined) {
      return res.status(400).json({ error: 'Missing config or data in request body' });
    }

    // Validate scope requirements
    if (scope === 'isolated') {
      if (!config.orbId || !config.providerId) {
        return res.status(400).json({ error: 'Isolated storage requires orbId and providerId' });
      }

      await db
        .insertInto('thread_isolated_storage')
        .values({
          orb_id: config.orbId,
          provider_id: config.providerId,
          storage_json: data,
        })
        .onConflict((oc) =>
          oc.columns(['orb_id', 'provider_id']).doUpdateSet({
            storage_json: data,
            updated_at: new Date().toISOString(),
          })
        )
        .execute();

      return res.json({ success: true });
    } else if (scope === 'network') {
      if (!config.sectorId || !config.chain || !config.providerId) {
        return res.status(400).json({ error: 'Network storage requires sectorId, chain, and providerId' });
      }

      await db
        .insertInto('thread_network_storage')
        .values({
          sector_id: config.sectorId,
          chain: config.chain,
          provider_id: config.providerId,
          storage_json: data,
        })
        .onConflict((oc) =>
          oc.columns(['sector_id', 'chain', 'provider_id']).doUpdateSet({
            storage_json: data,
            updated_at: new Date().toISOString(),
          })
        )
        .execute();

      return res.json({ success: true });
    } else {
      return res.status(400).json({ error: 'Invalid scope' });
    }
  } catch (error) {
    console.error('Error setting storage:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /internal/storage/:scope
 * Delete storage for scoped entity
 */
export const deleteStorage = async (req: Request, res: Response) => {
  try {
    const scope = req.params.scope as 'isolated' | 'network';
    const configHeader = req.headers['x-storage-config'] as string;

    if (!configHeader) {
      return res.status(400).json({ error: 'Missing X-Storage-Config header' });
    }

    const config: StorageConfig = JSON.parse(configHeader);

    // Validate scope requirements
    if (scope === 'isolated') {
      if (!config.orbId || !config.providerId) {
        return res.status(400).json({ error: 'Isolated storage requires orbId and providerId' });
      }

      await db
        .deleteFrom('thread_isolated_storage')
        .where('orb_id', '=', config.orbId)
        .where('provider_id', '=', config.providerId)
        .execute();

      return res.json({ success: true });
    } else if (scope === 'network') {
      if (!config.sectorId || !config.chain || !config.providerId) {
        return res.status(400).json({ error: 'Network storage requires sectorId, chain, and providerId' });
      }

      await db
        .deleteFrom('thread_network_storage')
        .where('sector_id', '=', config.sectorId)
        .where('chain', '=', config.chain)
        .where('provider_id', '=', config.providerId)
        .execute();

      return res.json({ success: true });
    } else {
      return res.status(400).json({ error: 'Invalid scope' });
    }
  } catch (error) {
    console.error('Error deleting storage:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
