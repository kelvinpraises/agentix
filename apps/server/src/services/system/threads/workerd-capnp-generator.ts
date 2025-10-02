import { readFileSync } from "fs";
import path from "path";

import { ThreadProvider } from "@/types/threads";
import {
  isIsolatedStoragePermission,
  isNetworkStoragePermission,
  isWalletPermission,
} from "@/utils/permissions";

/**
 * Read extension file content and escape for embedding in capnp
 */
function readExtensionFile(filename: string): string {
  const filePath = path.join(__dirname, "extensions", filename);
  const content = readFileSync(filePath, "utf-8");
  // Escape backticks for embedding in capnp text literals
  return content.replace(/`/g, "\\`");
}

function generateCapnp({
  port,
  workerSource,
  compatibilityDate,
  type = "module",
  provider,
  orbId,
  sectorId,
  chain,
  rpcUrl = "http://localhost:4848/rpc",
}: {
  port: number;
  workerSource: string;
  compatibilityDate: string;
  type?: "module" | "script";
  provider: ThreadProvider;
  orbId: number;
  sectorId: number;
  chain: string;
  rpcUrl?: string;
}) {
  const workerConfig =
    type === "module"
      ? `modules = [ (name = "worker", esModule = ${workerSource}) ],`
      : `serviceWorkerScript = ${workerSource},`;

  // Generate bindings based on provider permissions (deduplicated)
  const bindings: string[] = [];
  const addedBindings = new Set<string>();

  // Determine storage scope from permissions
  const isolatedStoragePerm = provider.permissions.find(isIsolatedStoragePermission);
  const networkStoragePerm = provider.permissions.find(isNetworkStoragePermission);

  // Storage binding (if any storage permission exists)
  if ((isolatedStoragePerm || networkStoragePerm) && !addedBindings.has("storage")) {
    const storageScope = isolatedStoragePerm ? "isolated" : "network";
    const innerBindings: string[] = [
      `(name = "providerId", text = "${provider.id}")`,
      `(name = "storageScope", text = "${storageScope}")`,
      `(name = "orbId", text = "${orbId}")`,
      `(name = "sectorId", text = "${sectorId}")`,
      `(name = "apiBaseUrl", text = "${rpcUrl}")`,
    ];

    if (networkStoragePerm) {
      innerBindings.push(`(name = "chain", text = "${chain}")`);
    }

    bindings.push(`(name = "storage", wrapped = (
      moduleName = "agentix:storage-binding",
      innerBindings = [${innerBindings.join(", ")}]
    ))`);
    addedBindings.add("storage");
  }

  // Wallet binding (if any wallet permission exists)
  const hasWalletPermission = provider.permissions.some((p) => isWalletPermission(p));
  if (hasWalletPermission && !addedBindings.has("wallet")) {
    const innerBindings: string[] = [
      `(name = "orbId", text = "${orbId}")`,
      `(name = "sectorId", text = "${sectorId}")`,
      `(name = "chain", text = "${chain}")`,
      `(name = "apiBaseUrl", text = "${rpcUrl}")`,
    ];

    bindings.push(`(name = "wallet", wrapped = (
      moduleName = "agentix:wallet-binding",
      innerBindings = [${innerBindings.join(", ")}]
    ))`);
    addedBindings.add("wallet");
  }

  const bindingsStr = bindings.length > 0 ? bindings.join(", ") : "";

  // Read extension files
  const storageImplContent = readExtensionFile("storage-impl.ts");
  const storageBindingContent = readExtensionFile("storage-binding.ts");
  const walletImplContent = readExtensionFile("wallet-impl.ts");
  const walletBindingContent = readExtensionFile("wallet-binding.ts");

  const capnp = `
    using Workerd = import "/workerd/workerd.capnp";

    const config :Workerd.Config = (
        services = [ (name = "main", worker = .mainWorker) ],
        sockets = [ ( name = "http", address = "*:${port}", http = (), service = "main" ) ],
        extensions = [ .agentixExtension ]
    );

    const agentixExtension :Workerd.Extension = (
        modules = [
            ( name = "agentix-internal:storage-impl", esModule = "${storageImplContent}", internal = true ),
            ( name = "agentix:storage-binding", esModule = "${storageBindingContent}", internal = true ),
            ( name = "agentix-internal:wallet-impl", esModule = "${walletImplContent}", internal = true ),
            ( name = "agentix:wallet-binding", esModule = "${walletBindingContent}", internal = true )
        ]
    );

    const mainWorker :Workerd.Worker = (
      ${workerConfig}
      compatibilityDate = "${compatibilityDate}",
      compatibilityFlags = ["typescript_strip_types"],
      bindings = [ ${bindingsStr} ]
    );
  `;
  return capnp;
}

export default generateCapnp;
