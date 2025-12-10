// src/config.js
// Global configuration: filesystem paths, RPC registry, token registry.

import fs from "fs";
import os from "os";
import path from "path";

// Base hidden directory for wallet data, e.g. ~/.cli-wallet
export const baseDir = path.join(os.homedir(), ".cli-wallet");

if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

// Encrypted keystore path (single active wallet)
export const KEYSTORE_PATH = path.join(baseDir, "wallet.json");

// JSON config path (RPC URLs + imported tokens)
const CONFIG_PATH = path.join(baseDir, "config.json");

// Default configuration used on first run or if config file is missing.
const defaultConfig = {
  rpcs: {
    mainnet: "https://ethereum.publicnode.com",
    sepolia: "https://ethereum-sepolia.publicnode.com",
    polygon: "https://polygon-bor.publicnode.com",
    bsc: "https://bsc.publicnode.com",
    base: "https://mainnet.base.org"
  },
  tokens: {
    // "network": [ { address, symbol, decimals }, ... ]
  }
};

// Load configuration from disk, merging with defaults.
export function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { ...defaultConfig };
  }

  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);

    return {
      rpcs: { ...defaultConfig.rpcs, ...(parsed.rpcs || {}) },
      tokens: { ...(parsed.tokens || {}) }
    };
  } catch {
    return { ...defaultConfig };
  }
}

// BigInt-safe JSON stringify
function stringifySafeBigInt(obj) {
  return JSON.stringify(
    obj,
    (key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    2
  );
}

// Persist configuration back to disk (BigInt safe).
export function saveConfig(cfg) {
  const toSave = {
    rpcs: cfg.rpcs || defaultConfig.rpcs,
    tokens: cfg.tokens || {}
  };

  const json = stringifySafeBigInt(toSave);
  fs.writeFileSync(CONFIG_PATH, json, "utf8");
  console.log("Config saved.\n");
}
