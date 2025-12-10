// src/index.js

import readlineSync from "readline-sync";
import { walletCreate } from "./walletCreate.js";
import { walletImportPk } from "./walletImportPk.js";
import { receiveAddress } from "./receive.js";
import { showAllNativeBalances } from "./balance.js";
import { sendTx } from "./send.js";
import { manageRpc } from "./rpcManage.js";
import {
  manageTokens,
  showTokenBalances,
  sendTokenTx
} from "./tokens.js";
import {
  deleteWallet,
  keystoreExists,
  loadWalletFromDisk
} from "./keystore.js";

let sessionWallet = null;

async function unlockIfNeeded() {
  if (sessionWallet) return;
  if (!keystoreExists()) return;

  console.log("Unlock your wallet to start.");
  sessionWallet = await loadWalletFromDisk();
  console.log("Wallet unlocked for this session.\n");

  await showAllNativeBalances(sessionWallet);
}

async function getWallet() {
  await unlockIfNeeded();

  if (!sessionWallet) {
    console.log("No wallet loaded. Create or import one first.\n");
    return null;
  }
  return sessionWallet;
}

async function mainMenu() {
  await unlockIfNeeded();

  while (true) {
    console.log("=== CLI Crypto Wallet ===");
    console.log("1) Create new wallet");
    console.log("2) Import wallet (private key)");
    console.log("3) Receive (address + QR)");
    console.log("4) Show native balances (all RPCs)");
    console.log("5) Send native transaction");
    console.log("6) Manage RPC (list/add/remove)");
    console.log("7) Manage tokens (list/import/remove)");
    console.log("8) Show token balances");
    console.log("9) Send token (ERC-20)");
    console.log("10) Delete wallet (DANGER)");
    console.log("0) Exit");

    const choice = readlineSync.question("Choose option: ").trim();
    console.log();

    try {
      if (choice === "1") {
        sessionWallet = await walletCreate();
        await showAllNativeBalances(sessionWallet);

      } else if (choice === "2") {
        sessionWallet = await walletImportPk();
        await showAllNativeBalances(sessionWallet);

      } else if (choice === "3") {
        const w = await getWallet();
        if (!w) continue;
        await receiveAddress(w);

      } else if (choice === "4") {
        const w = await getWallet();
        if (!w) continue;
        await showAllNativeBalances(w);

      } else if (choice === "5") {
        const w = await getWallet();
        if (!w) continue;
        await sendTx(w);

      } else if (choice === "6") {
        manageRpc();

      } else if (choice === "7") {
        await manageTokens();

      } else if (choice === "8") {
        const w = await getWallet();
        if (!w) continue;
        await showTokenBalances(w);

      } else if (choice === "9") {
        const w = await getWallet();
        if (!w) continue;
        await sendTokenTx(w);

      } else if (choice === "10") {
        deleteWallet();
        sessionWallet = null;

      } else if (choice === "0") {
        console.log("Bye.");
        process.exit(0);

      } else {
        console.log("Invalid choice.\n");
      }
    } catch (err) {
      console.log("Unexpected error:", err.message || err, "\n");
    }
  }
}

mainMenu().catch(err => {
  console.error("Fatal error:", err.message || err);
});
