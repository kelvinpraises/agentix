import { createHash } from "crypto";

import { ThreadConfig } from "@/types/threads";

export function createConfigHash(providerId: string, config: ThreadConfig): string {
  const hash = createHash("sha256");
  hash.update(providerId);
  hash.update(JSON.stringify(config, Object.keys(config).sort()));
  return hash.digest("hex");
}
