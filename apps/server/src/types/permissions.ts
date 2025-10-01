/**
 * When a user installs a thread, they automatically grant all permissions
 * declared by the thread provider. Permissions are declarative and non-optional.
 *
 * Permissions follow the format: "resource::scope::identifier"
 */

/**
 * Storage permissions control access to thread storage systems.
 * - `storage::isolated` - Thread's own private storage (scoped to orb + provider)
 * - `storage::network::{providerId}` - Access to network infrastructure storage (sector-scoped)
 */
export type StoragePermission = "storage::isolated" | `storage::network::${string}`;

/**
 * Wallet permissions control access to wallet operations via RPC.
 * - `wallet::read` - Read-only access to wallet address and public info
 * - `wallet::sign` - Permission to sign transactions (requires user confirmation)
 */
export type WalletPermission = "wallet::read" | "wallet::sign";

export type ThreadPermission = StoragePermission | WalletPermission;
