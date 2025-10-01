import { createServerAdapter } from "@whatwg-node/server";
import { newHttpBatchRpcResponse } from "capnweb";
import { Router } from "express";

import { protect } from "@/interfaces/rpc//middleware/auth";
import { localhostOnly } from "@/interfaces/rpc/middleware/localhost-only";
import { StorageTarget } from "@/interfaces/rpc/targets/storage-target";
import { WalletTarget } from "@/interfaces/rpc/targets/wallet-target";

async function rpcHandler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  let target;

  switch (true) {
    case pathname.endsWith("/storage"):
      target = new StorageTarget();
      break;
    case pathname.endsWith("/wallet"):
      target = new WalletTarget();
      break;
    default:
      return new Response(JSON.stringify({ error: "Unknown RPC target" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
  }

  try {
    const response = await newHttpBatchRpcResponse(request, target);
    return response;
  } catch (error) {
    console.error("RPC request error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal RPC error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// WHATWG Express-Compatible Adapter
const rpcAdapter = createServerAdapter(rpcHandler);

const router = Router();

// TODO: Add authentication middleware
router.use(protect);

router.post("/storage", localhostOnly, rpcAdapter);
router.post("/wallet", localhostOnly, rpcAdapter);

export default router;
