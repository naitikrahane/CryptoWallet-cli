// RPC network management: listing and creating providers.

import { JsonRpcProvider } from "ethers";
import { loadConfig } from "./config.js";

// Show all configured RPC networks to the user.
export function listNetworks() {
  const config = loadConfig();
  console.log("Available networks (RPC):");
  Object.entries(config.rpcs).forEach(([name, url]) => {
    console.log(`- ${name}: ${url}`);
  });
  console.log();
}

// Resolve a network name to a JsonRpcProvider.
// Throws if the network doesn't exist in config.
export function getProviderFor(network) {
  const config = loadConfig();
  const url = config.rpcs[network];
  if (!url) {
    throw new Error(`Unknown network: ${network}`);
  }
  return new JsonRpcProvider(url);
}
