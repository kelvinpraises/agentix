import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as chains from "viem/chains";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// a function to reduce the length of the users address
export function ellipsisAddress(address: string, length = 4) {
  return `${address.substring(0, 2 + length)}...${address.substring(
    address.length - length,
    address.length
  )}`;
}

export function satisfies(array: any[]) {
  return array.every(Boolean);
}

export function sanitizeSubdomain(input: string): string {
  const whitelist = /^[a-z0-9_]+$/;
  let sanitized = input.toLowerCase().replace(/\s+/g, "_");

  // Remove all characters not in the whitelist
  sanitized = sanitized
    .split("")
    .filter((char) => whitelist.test(char))
    .join("");

  return sanitized;
}

export function isEmpty(input: any): boolean {
  if (input === null || input === undefined) {
    return true;
  }

  if (typeof input === "object") {
    return Object.keys(input).length === 0;
  }

  if (Array.isArray(input)) {
    return input.length === 0;
  }

  return false;
}

export function getHostname(url: string): string | null {
  try {
    // If the URL doesn't have a protocol, prepend "http://"
    if (
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("ftp://")
    ) {
      url = "http://" + url;
    }
    const newURL = new URL(url);
    return newURL.hostname;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Invalid URL:", error.message);
    } else {
      console.error("Unknown error");
    }
    return null; // or you can return a custom error message or value
  }
}

export const isDevelopment = process.env.NODE_ENV === "development";

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return url;
  } catch (e) {
    return false;
  }
}

type Chain = (typeof chains)[keyof typeof chains];

/**
 * Gets the chain object for the given chain id or name.
 * @param chainIdOrName - Chain id or name of the target EVM chain.
 * @returns Viem's chain object.
 */
export function getChain(chainIdOrName: number | string): Chain {
  for (const chain of Object.values(chains)) {
    if (
      typeof chainIdOrName === "number"
        ? chain.id === chainIdOrName
        : chain.name.toLowerCase() === chainIdOrName.toLowerCase()
    ) {
      return chain;
    }
  }
  throw new Error(`Chain ${chainIdOrName} not found`);
}

export function formatNetworkName(network: string): string {
  return network
    .split("-")
    .map((word) => word.toLowerCase())
    .join(" ");
}
