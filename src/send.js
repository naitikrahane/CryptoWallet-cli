// src/send.js
// Dynamic native send with pre-balance checks.

import readlineSync from "readline-sync";
import { parseEther, formatEther } from "ethers";
import { loadWalletFromDisk } from "./keystore.js";
import { getProviderFor } from "./network.js";
import { loadConfig } from "./config.js";

// Build a dynamic network list from config.rpcs
function selectNetwork() {
  const config = loadConfig();
  const entries = Object.entries(config.rpcs || {});

  if (!entries.length) {
    console.log("No RPC networks configured. Add one first.\n");
    return null;
  }

  console.log("Select network:");
  entries.forEach(([key, url], index) => {
    console.log(`${index + 1}) ${key} -> ${url}`);
  });

  const answer = readlineSync
    .question(`Network [1-${entries.length}] (default 1): `)
    .trim();

  const index = answer === "" ? 0 : parseInt(answer, 10) - 1;

  const safeIndex =
    Number.isInteger(index) && index >= 0 && index < entries.length
      ? index
      : 0;

  const [key, url] = entries[safeIndex];
  return { key, url };
}

export async function sendTx(wallet) {
  let w = wallet;
  if (!w) {
    w = await loadWalletFromDisk();
  }

  const net = selectNetwork();
  if (!net) return;

  const to = readlineSync.question("To address: ").trim();
  const amountStr = readlineSync.question("Amount (native): ").trim();

  if (!to || !amountStr) {
    console.log("Destination address and amount are required.\n");
    return;
  }

  let amount;
  try {
    amount = parseEther(amountStr);
  } catch {
    console.log("Invalid amount format.\n");
    return;
  }

  try {
    const provider = getProviderFor(net.key);

    // 1) Check balance first
    const balance = await provider.getBalance(w.address);
    const balanceHuman = formatEther(balance);

    console.log(
      `Current balance on ${net.key}: ${balanceHuman} (native token)`
    );

    if (balance === 0n) {
      console.log(
        "Balance is 0 on this network. Fund this address before sending.\n"
      );
      return;
    }

    if (balance <= amount) {
      console.log(
        "Amount is greater than or equal to balance. Leave some for gas and try smaller amount.\n"
      );
      return;
    }

    const signer = w.connect(provider);

    console.log("\nNetwork:", net.key);
    console.log("From:   ", w.address);
    console.log("To:     ", to);
    console.log("Amount: ", amountStr);
    console.log("Sending transaction...\n");

    const tx = await signer.sendTransaction({
      to,
      value: amount
    });

    console.log("Tx hash:", tx.hash);
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Mined in block:", receipt.blockNumber, "\n");
  } catch (err) {
    const msg = (err.reason || err.message || "").toLowerCase();

    if (msg.includes("insufficient funds")) {
      console.log(
        "Transaction failed: insufficient funds for amount + gas.\n"
      );
    } else if (msg.includes("bad data") || msg.includes("network")) {
      console.log(
        "Transaction failed: RPC/network issue. Check your RPC URL.\n"
      );
    } else {
      console.log("Transaction error:", err.reason || err.message || err, "\n");
    }
  }
}
