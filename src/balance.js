// src/balance.js
// Dynamic native balance for all configured RPCs.

import { formatEther } from "ethers";
import { loadWalletFromDisk } from "./keystore.js";
import { getProviderFor } from "./network.js";
import { loadConfig } from "./config.js";

// Show balance on a single selected network (optional use)
export async function checkBalance(wallet, networkKey) {
  let w = wallet;
  if (!w) {
    w = await loadWalletFromDisk();
  }

  const netKey = networkKey || "base";

  try {
    const provider = getProviderFor(netKey);
    const balance = await provider.getBalance(w.address);

    console.log("\n[Native Balance]");
    console.log("Network:", netKey);
    console.log("Address:", w.address);
    console.log("Balance:", formatEther(balance), "\n");
  } catch (err) {
    console.log("Balance fetch failed:", err.message || err);
  }
}

// ✅ MAIN FEATURE: Show balances on ALL configured networks
export async function showAllNativeBalances(wallet) {
  let w = wallet;
  if (!w) {
    w = await loadWalletFromDisk();
  }

  const config = loadConfig();
  const entries = Object.entries(config.rpcs || {});

  if (!entries.length) {
    console.log("No RPC networks configured.\n");
    return;
  }

  console.log("\n==============================");
  console.log("   Native Balance Overview");
  console.log("==============================");
  console.log("Address:", w.address, "\n");

  for (const [networkKey] of entries) {
    try {
      const provider = getProviderFor(networkKey);
      const balance = await provider.getBalance(w.address);
      const formatted = formatEther(balance);

      console.log(`${networkKey.toUpperCase()}: ${formatted}`);
    } catch (err) {
      console.log(
        `${networkKey.toUpperCase()}: error (${err.message || err})`
      );
    }
  }

  console.log("==============================\n");
}
