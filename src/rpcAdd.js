// Add or update custom RPC entries.

import readlineSync from "readline-sync";
import { loadConfig, saveConfig } from "./config.js";

// Prompt for a network name and RPC URL, then save to config.
export function addCustomRpc() {
  const config = loadConfig();

  const name = readlineSync
    .question("New network name (e.g. mychain): ")
    .trim();

  if (!name) {
    console.log("Network name is required.\n");
    return;
  }

  const url = readlineSync
    .question("RPC URL (e.g. https://...): ")
    .trim();

  if (!url) {
    console.log("RPC URL is required.\n");
    return;
  }

  config.rpcs[name] = url;
  saveConfig(config);
  console.log(`RPC added/updated: ${name} -> ${url}\n`);
}
