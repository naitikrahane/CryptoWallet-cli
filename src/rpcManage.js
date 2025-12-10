// src/rpcManage.js
// List / add / remove RPC endpoints from config.

import readlineSync from "readline-sync";
import { loadConfig, saveConfig } from "./config.js";

function printRpcList(config) {
  const entries = Object.entries(config.rpcs || {});
  if (!entries.length) {
    console.log("No RPC networks configured.\n");
    return entries;
  }

  console.log("\nConfigured RPC networks:");
  entries.forEach(([name, url], i) => {
    console.log(`${i + 1}) ${name} -> ${url}`);
  });
  console.log();

  return entries;
}

function addRpc(config) {
  const name = readlineSync
    .question("New network name (e.g. base, arbitrum): ")
    .trim();

  if (!name) {
    console.log("Network name is required.\n");
    return;
  }

  const url = readlineSync.question("RPC URL (https://...): ").trim();
  if (!url) {
    console.log("RPC URL is required.\n");
    return;
  }

  const exists = !!config.rpcs[name];
  if (exists) {
    const confirm = readlineSync
      .question("This name already exists. Overwrite? (y/N): ")
      .trim()
      .toLowerCase();
    if (confirm !== "y") {
      console.log("Cancelled.\n");
      return;
    }
  }

  config.rpcs[name] = url;
  saveConfig(config);
  console.log(`RPC saved: ${name} -> ${url}\n`);
}

function removeRpc(config) {
  const entries = Object.entries(config.rpcs || {});
  if (!entries.length) {
    console.log("No RPC to remove.\n");
    return;
  }

  const list = printRpcList(config);

  const answer = readlineSync
    .question(`Remove which? [1-${list.length}] (0 = cancel): `)
    .trim();

  const idx = parseInt(answer, 10);
  if (!answer || isNaN(idx) || idx === 0) {
    console.log("Remove cancelled.\n");
    return;
  }

  if (idx < 1 || idx > list.length) {
    console.log("Invalid selection.\n");
    return;
  }

  const [name] = list[idx - 1];

  const confirm = readlineSync
    .question(`Type '${name}' to confirm remove: `)
    .trim();

  if (confirm !== name) {
    console.log("Confirmation mismatch. Cancelled.\n");
    return;
  }

  delete config.rpcs[name];
  saveConfig(config);
  console.log(`Removed RPC: ${name}\n`);
}

export function manageRpc() {
  const config = loadConfig();

  while (true) {
    const entries = printRpcList(config);

    console.log("RPC Manager:");
    console.log("1) Add RPC");
    console.log("2) Remove RPC");
    console.log("0) Back");

    const choice = readlineSync.question("Choose option: ").trim();
    console.log();

    if (choice === "1") {
      addRpc(config);
    } else if (choice === "2") {
      removeRpc(config);
    } else if (choice === "0") {
      return;
    } else {
      console.log("Invalid choice.\n");
    }
  }
}
