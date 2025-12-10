// src/tokens.js
// ERC-20 token management: import, list, remove, balances, send.

import readlineSync from "readline-sync";
import { Contract, formatUnits, parseUnits } from "ethers";
import { loadWalletFromDisk } from "./keystore.js";
import { getProviderFor } from "./network.js";
import { loadConfig, saveConfig } from "./config.js";

const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

// ----- helpers -----

function selectNetwork() {
  const config = loadConfig();
  const entries = Object.entries(config.rpcs || {});

  if (!entries.length) {
    console.log("No RPC networks configured. Add an RPC first.\n");
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

  const [key] = entries[safeIndex];
  return key;
}

function selectTokenFromNetwork(config, networkKey) {
  const tokens = config.tokens[networkKey] || [];

  if (!tokens.length) {
    console.log(`No tokens imported for network "${networkKey}".\n`);
    return null;
  }

  console.log(`Tokens on ${networkKey}:`);
  tokens.forEach((t, i) => {
    console.log(
      `${i + 1}) ${t.symbol} (${t.address.slice(0, 10)}..., decimals=${t.decimals})`
    );
  });

  const answer = readlineSync
    .question(`Select token [1-${tokens.length}] (0 = cancel): `)
    .trim();

  const idx = parseInt(answer, 10);

  if (!answer || isNaN(idx) || idx === 0) {
    console.log("Cancelled.\n");
    return null;
  }

  if (idx < 1 || idx > tokens.length) {
    console.log("Invalid selection.\n");
    return null;
  }

  return tokens[idx - 1];
}

// ----- import / remove -----

async function importTokenForNetwork(networkKey) {
  let config = loadConfig();

  const tokenAddress = readlineSync
    .question("Token contract address: ")
    .trim();

  if (!tokenAddress) {
    console.log("Token address is required.\n");
    return;
  }

  let symbol = "";
  let decimals = 18;

  try {
    const provider = getProviderFor(networkKey);
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);

    symbol = await contract.symbol();
    decimals = await contract.decimals(); // can be number, bigint, etc.
  } catch {
    console.log(
      "Auto-detect failed (RPC or contract issue). Enter values manually."
    );
    symbol =
      readlineSync.question("Token symbol (e.g. USDT): ").trim() || "TKN";
    const decStr =
      readlineSync.question("Token decimals (e.g. 18): ").trim() || "18";
    decimals = decStr;
  }

  // 🔑 normalize decimals to plain number
  decimals = Number(decimals);
  if (!Number.isFinite(decimals) || decimals < 0) {
    decimals = 18;
  }

  console.log(`Detected token: ${symbol} (decimals: ${decimals})`);

  config = loadConfig(); // reload latest

  if (!config.tokens[networkKey]) {
    config.tokens[networkKey] = [];
  }

  const lowerAddr = tokenAddress.toLowerCase();
  const existing = config.tokens[networkKey].find(
    t => t.address.toLowerCase() === lowerAddr
  );

  if (existing) {
    existing.symbol = symbol;
    existing.decimals = decimals;
    console.log("Token already existed, metadata updated.\n");
  } else {
    config.tokens[networkKey].push({
      address: tokenAddress,
      symbol,
      decimals // stored as Number
    });
    console.log("Token imported.\n");
  }

  saveConfig(config);
}

async function removeTokenFromNetwork(networkKey) {
  const config = loadConfig();
  const tokens = config.tokens[networkKey] || [];

  if (!tokens.length) {
    console.log(`No tokens to remove on network "${networkKey}".\n`);
    return;
  }

  console.log(`Tokens on ${networkKey}:`);
  tokens.forEach((t, i) => {
    console.log(
      `${i + 1}) ${t.symbol} (${t.address.slice(0, 10)}..., decimals=${t.decimals})`
    );
  });

  const answer = readlineSync
    .question(`Remove which? [1-${tokens.length}] (0 = cancel): `)
    .trim();

  const idx = parseInt(answer, 10);

  if (!answer || isNaN(idx) || idx === 0) {
    console.log("Remove cancelled.\n");
    return;
  }

  if (idx < 1 || idx > tokens.length) {
    console.log("Invalid selection.\n");
    return;
  }

  const tok = tokens[idx - 1];

  const confirm = readlineSync
    .question(`Type '${tok.symbol}' to confirm remove: `)
    .trim();

  if (confirm !== tok.symbol) {
    console.log("Confirmation mismatch. Cancelled.\n");
    return;
  }

  tokens.splice(idx - 1, 1);
  const newConfig = loadConfig();
  newConfig.tokens[networkKey] = tokens;
  saveConfig(newConfig);
  console.log(`Removed token ${tok.symbol}.\n`);
}

// ----- public: manage tokens -----

export async function manageTokens() {
  const networkKey = selectNetwork();
  if (!networkKey) return;

  while (true) {
    const config = loadConfig();
    const tokens = config.tokens[networkKey] || [];

    console.log(`\n=== Token Manager (${networkKey}) ===`);
    if (!tokens.length) {
      console.log("No tokens imported yet.");
    } else {
      tokens.forEach((t, i) => {
        console.log(
          `${i + 1}) ${t.symbol} (${t.address.slice(0, 10)}..., decimals=${t.decimals})`
        );
      });
    }
    console.log("\n1) Import token");
    console.log("2) Remove token");
    console.log("0) Back");

    const choice = readlineSync.question("Choose option: ").trim();
    console.log();

    if (choice === "1") {
      await importTokenForNetwork(networkKey);
    } else if (choice === "2") {
      await removeTokenFromNetwork(networkKey);
    } else if (choice === "0") {
      return;
    } else {
      console.log("Invalid choice.\n");
    }
  }
}

// ----- balances -----

export async function showTokenBalances(wallet) {
  let w = wallet;
  if (!w) {
    w = await loadWalletFromDisk();
  }

  const networkKey = selectNetwork();
  if (!networkKey) return;

  const config = loadConfig();
  const tokens = config.tokens[networkKey] || [];
  if (!tokens.length) {
    console.log(`No tokens imported on network "${networkKey}".\n`);
    return;
  }

  let provider;
  try {
    provider = getProviderFor(networkKey);
  } catch (e) {
    console.log("Network error:", e.message || e);
    return;
  }

  console.log(`\n[Token Balances on ${networkKey}]`);
  console.log("Address:", w.address, "\n");

  for (const token of tokens) {
    try {
      const dec = Number(token.decimals);
      const safeDec = Number.isFinite(dec) && dec >= 0 ? dec : 18;

      const contract = new Contract(token.address, ERC20_ABI, provider);
      const bal = await contract.balanceOf(w.address);
      const formatted = formatUnits(bal, safeDec);

      console.log(
        `${token.symbol} (${token.address.slice(0, 10)}...): ${formatted}`
      );
    } catch (e) {
      console.log(
        `Error fetching ${token.symbol} at ${token.address}:`,
        e.message || e
      );
    }
  }
  console.log();
}

// ----- send token -----

export async function sendTokenTx(wallet) {
  let w = wallet;
  if (!w) {
    w = await loadWalletFromDisk();
  }

  const networkKey = selectNetwork();
  if (!networkKey) return;

  const config = loadConfig();
  const tokens = config.tokens[networkKey] || [];
  if (!tokens.length) {
    console.log(`No tokens imported on network "${networkKey}".\n`);
    return;
  }

  let provider;
  try {
    provider = getProviderFor(networkKey);
  } catch (e) {
    console.log("Network error:", e.message || e);
    return;
  }

  const token = selectTokenFromNetwork(config, networkKey);
  if (!token) return;

  const to = readlineSync.question("To address: ").trim();
  const amountStr = readlineSync.question(
    `Amount (${token.symbol}): `
  ).trim();

  if (!to || !amountStr) {
    console.log("Destination address and amount are required.\n");
    return;
  }

  const dec = Number(token.decimals);
  const safeDec = Number.isFinite(dec) && dec >= 0 ? dec : 18;

  let amount;
  try {
    amount = parseUnits(amountStr, safeDec);
  } catch {
    console.log("Invalid amount format.\n");
    return;
  }

  try {
    const signer = w.connect(provider);
    const contract = new Contract(token.address, ERC20_ABI, signer);

    console.log("\nNetwork:", networkKey);
    console.log("Token:  ", token.symbol);
    console.log("From:   ", w.address);
    console.log("To:     ", to);
    console.log("Amount: ", amountStr);
    console.log("Sending token transfer...\n");

    const tx = await contract.transfer(to, amount);
    console.log("Tx hash:", tx.hash);
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Mined in block:", receipt.blockNumber, "\n");
  } catch (e) {
    const msg = (e.reason || e.message || "").toLowerCase();

    if (msg.includes("insufficient") || msg.includes("fund")) {
      console.log(
        "Token transfer failed: insufficient balance or gas.\n"
      );
    } else {
      console.log("Token transfer error:", e.reason || e.message || e, "\n");
    }
  }
}
