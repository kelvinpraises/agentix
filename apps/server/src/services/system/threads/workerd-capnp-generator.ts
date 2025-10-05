import { buildSync } from "esbuild";
import ky from "ky";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

import { ThreadProvider } from "@/types/threads";
import {
  isIsolatedStoragePermission,
  isNetworkStoragePermission,
  isWalletPermission,
} from "@/utils/permissions";

const ThreadProviderSchema = z.object({
  id: z.string().min(1),
  source: z.string().url(),
  type: z.enum(["module", "script"]),
  threadType: z.string(),
  permissions: z.array(z.string()),
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Bundle extension file with esbuild
 * @param filename - Extension file to bundle
 * @param bundleDeps - If true, bundles all dependencies (for -impl files with capnweb).
 *                     If false, only strips TypeScript and keeps imports external (for -binding files)
 */
function bundleExtensionFile(filename: string, bundleDeps: boolean): string {
  const filePath = path.join(__dirname, "extensions", filename);

  const result = buildSync({
    entryPoints: [filePath],
    bundle: true, // Always bundle to transpile TypeScript
    format: "esm",
    platform: "browser",
    write: false,
    minify: false,
    loader: { ".ts": "ts" },
    external: bundleDeps ? [] : ["agentix-internal:*"], // Keep agentix-internal imports external for binding files
  });

  const bundledCode = result.outputFiles[0].text;

  // JSON.stringify safely escapes all special characters for Cap'n Proto
  return JSON.stringify(bundledCode).slice(1, -1);
}

async function generateCapnp({
  port,
  provider,
  orbId,
  sectorId,
  chain,
  rpcUrl,
}: {
  port: number;
  provider: ThreadProvider;
  orbId: number;
  sectorId: number;
  chain: string;
  rpcUrl: string;
}) {
  const validatedProvider = ThreadProviderSchema.parse(provider);
  const workerSource = await ky.get(validatedProvider.source).text();
  const escapedWorkerSource = JSON.stringify(workerSource).slice(1, -1);

  const workerConfig =
    validatedProvider.type === "module"
      ? `modules = [( name = "worker", esModule = "${escapedWorkerSource}" )],`
      : `serviceWorkerScript = "${escapedWorkerSource}",`;

  // Generate bindings based on provider permissions
  const bindings: string[] = [];
  const addedBindings = new Set<string>();

  // Determine storage scope from permissions
  const isolatedStoragePerm = validatedProvider.permissions.find(
    isIsolatedStoragePermission
  );
  const networkStoragePerm = validatedProvider.permissions.find(isNetworkStoragePermission);

  // Storage binding (if any storage permission exists)
  if ((isolatedStoragePerm || networkStoragePerm) && !addedBindings.has("storage")) {
    const storageScope = isolatedStoragePerm ? "isolated" : "network";
    const innerBindings: string[] = [
      `( name = "providerId", text = "${validatedProvider.id}") `,
      `( name = "storageScope", text = "${storageScope}") `,
      `( name = "orbId", text = "${orbId}") `,
      `( name = "sectorId", text = "${sectorId}") `,
      `( name = "apiBaseUrl", text = "${rpcUrl}") `,
    ];

    if (networkStoragePerm) {
      innerBindings.push(`( name = "chain", text = "${chain}" )`);
    }

    bindings.push(`
    (
      name = "storage",
      wrapped = (
        moduleName = "agentix:storage-binding",
        innerBindings = [
          ${innerBindings.join(",\n          ")}
        ]
      )
    )`);
    addedBindings.add("storage");
  }

  // Wallet binding (if any wallet permission exists)
  const hasWalletPermission = validatedProvider.permissions.some((p) =>
    isWalletPermission(p)
  );
  if (hasWalletPermission && !addedBindings.has("wallet")) {
    const innerBindings: string[] = [
      `( name = "orbId", text = "${orbId}") `,
      `( name = "sectorId", text = "${sectorId}") `,
      `( name = "chain", text = "${chain}") `,
      `( name = "apiBaseUrl", text = "${rpcUrl}") `,
    ];

    bindings.push(`
    (
      name = "wallet",
      wrapped = (
        moduleName = "agentix:wallet-binding",
        innerBindings = [
          ${innerBindings.join(",\n          ")}
        ]
      )
    )`);
    addedBindings.add("wallet");
  }

  const bindingsStr = bindings.length > 0 ? bindings.join(",") : "";

  // Bundle all extension files with esbuild
  // -impl files: bundle dependencies (capnweb)
  // -binding files: strip TypeScript but don't bundle agentix-internal imports
  const storageImplContent = bundleExtensionFile("storage-impl.ts", true);
  const walletImplContent = bundleExtensionFile("wallet-impl.ts", true);
  const storageBindingContent = bundleExtensionFile("storage-binding.ts", false);
  const walletBindingContent = bundleExtensionFile("wallet-binding.ts", false);

  const capnp = `using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [( name = "main", worker = .mainWorker )],
  sockets = [( name = "http", address = "*:${port}", http = (), service = "main" )],
  extensions = [.agentixExtension]
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
  compatibilityDate = "2025-09-26",
  bindings = [${bindingsStr}
  ]
);
`;
  return capnp;
}

export default generateCapnp;
