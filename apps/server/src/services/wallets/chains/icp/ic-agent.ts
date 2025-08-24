import { IDL } from "@icp-sdk/core/candid";
import { Principal } from "@icp-sdk/core/principal";
import { Encoder, Decoder } from "cbor-x";

export interface ICCallRequest {
  request_type: "call";
  canister_id: string;
  method_name: string;
  arg: Uint8Array;
  sender: string;
  ingress_expiry: bigint;
}

export interface ICQueryRequest {
  request_type: "query";
  canister_id: string;
  method_name: string;
  arg: Uint8Array;
  sender: string;
  ingress_expiry: bigint;
}

export interface ICSignedRequest {
  body: {
    content: ICCallRequest | ICQueryRequest;
    sender_pubkey: Uint8Array;
    sender_sig: Uint8Array;
  };
}

export interface ICCallResponse {
  status: "replied" | "rejected";
  reply?: {
    arg: Uint8Array;
  };
  reject_code?: number;
  reject_message?: string;
}

export interface ICQueryResponse {
  status: "replied" | "rejected";
  reply?: {
    arg: Uint8Array;
  };
  reject_code?: number;
  reject_message?: string;
}

export class ICNetworkError extends Error {
  constructor(message: string, public code?: number, public canisterId?: string) {
    super(message);
    this.name = "ICNetworkError";
  }
}

export class ICAgent {
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly cborEncoder: Encoder;
  private readonly cborDecoder: Decoder;

  constructor(
    options: {
      network?: "mainnet" | "testnet" | "local";
      maxRetries?: number;
      timeoutMs?: number;
    } = {}
  ) {
    const { network = "mainnet", maxRetries = 3, timeoutMs = 30000 } = options;

    this.baseUrl = this.getNetworkUrl(network);
    this.maxRetries = maxRetries;
    this.timeoutMs = timeoutMs;
    this.cborEncoder = new Encoder();
    this.cborDecoder = new Decoder();
  }

  private getNetworkUrl(network: string): string {
    switch (network) {
      case "mainnet":
        return "https://ic0.app";
      case "testnet":
        return "https://ic0.app"; // IC uses same URL for mainnet/testnet
      case "local":
        return "http://localhost:4943"; // Local dfx replica
      default:
        return "https://ic0.app";
    }
  }

  async submitCall(signedRequest: ICSignedRequest): Promise<ICCallResponse> {
    const url = `${this.baseUrl}/api/v2/canister/${signedRequest.body.content.canister_id}/call`;

    return this.executeRequest(url, signedRequest);
  }

  async submitQuery(signedRequest: ICSignedRequest): Promise<ICQueryResponse> {
    const url = `${this.baseUrl}/api/v2/canister/${signedRequest.body.content.canister_id}/query`;

    return this.executeRequest(url, signedRequest);
  }

  private async executeRequest(
    url: string,
    signedRequest: ICSignedRequest
  ): Promise<ICCallResponse | ICQueryResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeHttpRequest(url, signedRequest);

        if (response.ok) {
          const responseData = await response.arrayBuffer();
          return this.parseICResponse(new Uint8Array(responseData));
        } else {
          throw new ICNetworkError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            signedRequest.body.content.canister_id
          );
        }
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.maxRetries) {
          break;
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw new ICNetworkError(
      `Failed after ${this.maxRetries} attempts: ${lastError?.message}`,
      undefined,
      signedRequest.body.content.canister_id
    );
  }

  private async makeHttpRequest(
    url: string,
    signedRequest: ICSignedRequest
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const cborBody = this.encodeCBOR(signedRequest);
      return await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/cbor",
        },
        body: cborBody.buffer.slice(0) as ArrayBuffer, // Convert to proper ArrayBuffer
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private encodeCBOR(signedRequest: ICSignedRequest): Uint8Array {
    const content = signedRequest.body.content;

    // Properly encode the IC request structure for CBOR
    const requestData = {
      content: {
        request_type: content.request_type,
        canister_id: Principal.fromText(content.canister_id).toUint8Array(),
        method_name: content.method_name,
        arg: Array.from(content.arg), // Convert Uint8Array to regular array for CBOR
        sender: Principal.fromText(content.sender).toUint8Array(),
        ingress_expiry: content.ingress_expiry.toString(), // Convert bigint to string for CBOR
      },
      sender_pubkey: Array.from(signedRequest.body.sender_pubkey),
      sender_sig: Array.from(signedRequest.body.sender_sig),
    };

    return this.cborEncoder.encode(requestData);
  }

  private parseICResponse(responseBytes: Uint8Array): ICCallResponse | ICQueryResponse {
    try {
      // Decode CBOR response from IC network
      const response = this.cborDecoder.decode(responseBytes) as any;

      if (response.status === "replied") {
        return {
          status: "replied",
          reply: {
            arg: new Uint8Array(response.reply?.arg || []),
          },
        };
      } else {
        return {
          status: "rejected",
          reject_code: response.reject_code || 5, // CANISTER_ERROR
          reject_message: response.reject_message || "Unknown error",
        };
      }
    } catch (error) {
      throw new ICNetworkError(
        `Failed to parse IC CBOR response: ${error}`,
        undefined,
        undefined
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance for the application
export const icAgent = new ICAgent({
  network: (process.env.IC_NETWORK as "mainnet" | "testnet" | "local") || "mainnet",
  maxRetries: 3,
  timeoutMs: 30000,
});

// Helper functions for parsing ICRC-1 responses
export function parseICRC1TransferResponse(responseArg: Uint8Array): bigint | string {
  try {
    // ICRC-1 transfer returns Result<Nat, TransferError>
    const decoded = IDL.decode(
      [
        IDL.Variant({
          Ok: IDL.Nat,
          Err: IDL.Variant({
            BadFee: IDL.Record({ expected_fee: IDL.Nat }),
            BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
            InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
            TooOld: IDL.Null,
            CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
            Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
            TemporarilyUnavailable: IDL.Null,
            GenericError: IDL.Record({ message: IDL.Text, error_code: IDL.Nat }),
          }),
        }),
      ],
      responseArg
    );

    const result = decoded[0] as any;

    if ("Ok" in result) {
      return result.Ok as bigint; // Transaction index
    } else {
      const errorType = Object.keys(result.Err)[0];
      return `ICRC1_ERROR_${errorType}`;
    }
  } catch (error) {
    throw new Error(`Failed to parse ICRC-1 transfer response: ${error}`);
  }
}

export function parseICRC1BalanceResponse(responseArg: Uint8Array): bigint {
  try {
    // ICRC-1 balance returns Nat
    const decoded = IDL.decode([IDL.Nat], responseArg);
    return decoded[0] as bigint;
  } catch (error) {
    throw new Error(`Failed to parse ICRC-1 balance response: ${error}`);
  }
}
