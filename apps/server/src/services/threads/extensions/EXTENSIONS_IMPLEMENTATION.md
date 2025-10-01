# Thread Extensions Implementation Guide

## Overview

This document describes the refactored thread extension system for Agentix, following the Cloudflare Workerd extension pattern with scoped bindings.

## Architecture

### Extension Pattern

```
Extension Definition (agentix-extensions.capnp)
  ├── Public Modules (importable by threads)
  │   ├── agentix:storage
  │   └── agentix:wallet
  │
  └── Internal Modules (extension-only)
      ├── agentix-internal:storage-impl
      ├── agentix:storage-binding
      ├── agentix-internal:wallet-impl
      └── agentix:wallet-binding
```

### Binding Flow

```
Thread Worker (env.storage.get())
  ↓
Wrapped Binding (agentix:storage-binding)
  ↓ (with innerBindings: orbId, sectorId, providerId, etc.)
Implementation (agentix-internal:storage-impl)
  ↓
HTTP Request to Agentix API (/internal/storage)
  ↓
Database (thread_isolated_storage or thread_network_storage)
```

## Security Model

### Scoping via innerBindings

When a thread is deployed, we inject scoping parameters as `innerBindings`:

```capnp
bindings = [
  ( name = "storage",
    wrapped = (
      moduleName = "agentix:storage-binding",
      innerBindings = [
        ( name = "orbId", text = "123" ),
        ( name = "sectorId", text = "456" ),
        ( name = "providerId", text = "paper-coingecko" ),
        ( name = "storageScope", text = "isolated" )
      ]
    )
  )
]
```

**Key Security Properties:**
1. **Immutable scoping**: Thread cannot modify `orbId`/`sectorId` - they're baked into the binding
2. **API-level validation**: `/internal/storage` and `/internal/wallet/rpc` validate ownership
3. **No direct DB access**: Threads always go through HTTP middleware
4. **Permission-based binding generation**: Bindings only created if thread declares appropriate permissions

## File Structure

```
apps/server/src/
├── services/threads/extensions/
│   ├── agentix-extensions.capnp       # Extension definition
│   ├── storage-impl.ts                # Storage implementation (HTTP client)
│   ├── storage-binding.ts             # Storage binding factory
│   ├── storage.ts                     # Public storage API
│   ├── wallet-impl.ts                 # Wallet implementation (JSON-RPC client)
│   ├── wallet-binding.ts              # Wallet binding factory
│   └── wallet.ts                      # Public wallet API
│
├── interfaces/api/
│   ├── routes/internal.ts             # Internal API routes
│   └── controllers/
│       ├── internalStorageController.ts  # Storage CRUD handlers
│       └── internalWalletController.ts   # Wallet RPC handlers
│
└── utils/threads.ts                   # generateCapnp() with wrapped bindings
```

## Storage Extension

### API Design

**Thread API:**
```typescript
// In thread worker
const data = await env.storage.get();      // Returns entire storage_json or null
await env.storage.set({ foo: 'bar' });     // Replaces entire storage_json
await env.storage.delete();                // Deletes storage
```

**Implementation:**
- Minimal API: get/set/delete entire JSON blob
- Thread handles its own low-level data structure
- Scoped by permissions: `isolated` (orb-level) or `network` (sector-level)

### Storage Scoping

**Isolated Storage** (`storage::isolated`):
- Scoped to: `orbId` + `providerId`
- Use case: Thread-private data
- Table: `thread_isolated_storage`

**Network Storage** (`storage::network::<chain>`):
- Scoped to: `sectorId` + `chain` + `providerId`
- Use case: Cross-orb data within a sector (e.g., paper trading network state)
- Table: `thread_network_storage`

### HTTP API

**GET /internal/storage/:scope**
- Headers: `X-Storage-Config: {"orbId": 123, "providerId": "...", ...}`
- Returns: `{ storage: <storage_json> }` or 404

**PUT /internal/storage/:scope**
- Body: `{ config: {...}, data: {...} }`
- Action: Upsert storage_json

**DELETE /internal/storage/:scope**
- Headers: `X-Storage-Config: {...}`
- Action: Delete storage

## Wallet Extension

### API Design

**Thread API:**
```typescript
// In thread worker
const address = await env.wallet.getAddress();
const balance = await env.wallet.getBalance();
const tokenBalance = await env.wallet.getTokenBalance('0x...');
const txHash = await env.wallet.sendTransaction({ to, value });
const signed = await env.wallet.signTransaction(tx);
const tx = await env.wallet.getTransaction(txHash);
const gas = await env.wallet.estimateGas(tx);
const gasPrice = await env.wallet.getGasPrice();
const info = await env.wallet.getChainInfo();
```

**Implementation:**
- JSON-RPC 2.0 interface over HTTP
- First param always `WalletConfig` (injected by binding)
- Scoped to: `orbId` + `sectorId` + `chain`

### HTTP API

**POST /internal/wallet/rpc**
- Body: JSON-RPC 2.0 request
  ```json
  {
    "jsonrpc": "2.0",
    "method": "wallet_getBalance",
    "params": [
      { "orbId": 123, "sectorId": 456, "chain": "ethereum" }
    ],
    "id": 1
  }
  ```
- Returns: JSON-RPC 2.0 response
- Methods:
  - `wallet_getAddress`
  - `wallet_getBalance`
  - `wallet_getTokenBalance`
  - `wallet_sendTransaction`
  - `wallet_signTransaction`
  - `wallet_getTransaction`
  - `wallet_estimateGas`
  - `wallet_getGasPrice`
  - `wallet_getChainInfo`

## Permission System

### Storage Permissions

```typescript
"storage::isolated"                    // Orb-scoped storage
"storage::network::<chain>"            // Sector-scoped network storage
```

### Wallet Permissions

```typescript
"wallet::read"                         // Read-only wallet operations
"wallet::sign"                         // Sign transactions
```

### Binding Generation Logic

**Storage:**
1. Check if thread has `storage::isolated` or `storage::network::*` permission
2. Determine scope from permission type
3. Generate wrapped binding with appropriate innerBindings
4. If network storage, include `chain` in innerBindings

**Wallet:**
1. Check if thread has `wallet::read` or `wallet::sign` permission
2. Generate wrapped binding with `orbId`, `sectorId`, `chain` innerBindings

## Usage Example

### Thread Provider Declaration

```typescript
const paperCoingeckoProvider: ThreadProvider = {
  id: 'paper-coingecko',
  name: 'Paper Coingecko Network',
  threadType: 'network_infra',
  permissions: [
    'storage::network::paper',
    'wallet::read'
  ],
  source: 'https://example.com/paper-coingecko.js',
  type: 'module'
};
```

### Generated .capnp File

```capnp
using Workerd = import "/workerd/workerd.capnp";
using AgentixExtensions = import "agentix-extensions.capnp";

const config :Workerd.Config = (
  services = [ (name = "main", worker = .mainWorker) ],
  sockets = [ ( name = "http", address = "*:8080", http = (), service = "main" ) ],
  extensions = [ AgentixExtensions.extension ]
);

const mainWorker :Workerd.Worker = (
  modules = [ (name = "worker", esModule = embed "worker.js") ],
  compatibilityDate = "2025-09-26",
  bindings = [
    (name = "storage", wrapped = (
      moduleName = "agentix:storage-binding",
      innerBindings = [
        (name = "providerId", text = "paper-coingecko"),
        (name = "storageScope", text = "network"),
        (name = "orbId", text = "123"),
        (name = "sectorId", text = "456"),
        (name = "chain", text = "paper")
      ]
    )),
    (name = "wallet", wrapped = (
      moduleName = "agentix:wallet-binding",
      innerBindings = [
        (name = "orbId", text = "123"),
        (name = "sectorId", text = "456"),
        (name = "chain", text = "paper")
      ]
    ))
  ]
);
```

### Thread Worker Code

```javascript
export default {
  async fetch(req, env) {
    // Access scoped storage
    const state = await env.storage.get() || { prices: {} };

    // Update state
    state.prices['BTC/USD'] = 50000;
    await env.storage.set(state);

    // Access scoped wallet
    const address = await env.wallet.getAddress();
    const balance = await env.wallet.getBalance();

    return new Response(JSON.stringify({ address, balance }));
  }
};
```

## TODO: Implementation Gaps

### Critical
1. **Compile extension modules**: TypeScript → JavaScript for workerd embedding
2. **Test extension loading**: Verify workerd can load `agentix-extensions.capnp`
3. **Implement wallet RPC methods**: Currently all throw "not yet implemented"

### Nice-to-Have
1. **Add caching**: Cache storage reads in extension impl
2. **Add retry logic**: Handle transient HTTP failures
3. **Add metrics**: Track extension call latency
4. **Add rate limiting**: Prevent abuse of internal APIs

## Comparison with Old System

### Old (Deleted)
- `storage-service.ts`: Sprawling CRUD functions (8+ methods)
- Direct database calls from service layer
- No scoping enforcement at binding level
- Stub extension with in-memory storage

### New (Current)
- Simple get/set API (3 methods)
- HTTP-based with middleware validation
- Scoping enforced via innerBindings (immutable)
- Real extension with database backing

## Next Steps

1. **Build extension modules**: Add TypeScript compilation step for extensions
2. **Create example thread**: Paper Coingecko network provider
3. **Test end-to-end**: Deploy thread → access storage → access wallet
4. **Implement wallet methods**: Complete the RPC handlers
5. **Document thread development**: Guide for building new thread providers
