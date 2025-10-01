import { ChildProcess } from "child_process";

import { SectorContext } from "@/types/sector";
import { ThreadsTable } from "@/infrastructure/database/schema";

export type ThreadConfig = SectorContext["orbs"][number]["threads"][number]["config"];
export type ThreadType = ThreadsTable["type"];

export interface ManagedProcess {
  process: ChildProcess;
  port: number;
  hash: string;
  lastUsed: number;
  tempDir?: string;
}

export type ThreadProvider = {
  id: string;
  source: string;
  type: "module" | "script";
  threadType: ThreadType;
  permissions: string[]; // Format: "resource::scope::identifier" e.g., "storage::isolated", "wallet::read"
};
