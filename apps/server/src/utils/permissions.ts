/**
 * Parse a permission string into its components
 */
export function parsePermission(permission: string): {
  resource: string;
  scope: string;
  identifier?: string;
} {
  const parts = permission.split("::");
  return {
    resource: parts[0],
    scope: parts[1],
    identifier: parts[2],
  };
}

/**
 * Check if a permission grants network storage access
 */
export function isNetworkStoragePermission(permission: string): boolean {
  const { resource, scope } = parsePermission(permission);
  return resource === "storage" && scope === "network";
}

/**
 * Check if a permission grants isolated storage access
 */
export function isIsolatedStoragePermission(permission: string): boolean {
  const { resource, scope } = parsePermission(permission);
  return resource === "storage" && scope === "isolated";
}

/**
 * Check if a permission grants wallet access
 */
export function isWalletPermission(permission: string): boolean {
  const { resource } = parsePermission(permission);
  return resource === "wallet";
}

/**
 * Validate permission string format
 */
export function validatePermission(permission: string): boolean {
  const parts = permission.split("::");
  if (parts.length < 2 || parts.length > 3) return false;

  const [resource, scope] = parts;

  // Validate storage permissions
  if (resource === "storage") {
    if (scope === "isolated") return parts.length === 2;
    if (scope === "network") return parts.length === 3;
    return false;
  }

  // Validate wallet permissions
  if (resource === "wallet") {
    return parts.length === 2 && (scope === "read" || scope === "sign");
  }

  return false;
}