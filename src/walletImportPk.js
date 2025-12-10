// Import an existing wallet from a raw private key and encrypt it.

import readlineSync from "readline-sync";
import { Wallet } from "ethers";
import { saveWalletEncrypted } from "./keystore.js";

// Ask user for a private key, create a wallet, and save it as keystore.
// Returns the in-memory wallet instance so the session can reuse it.
export async function walletImportPk() {
  const pkInput = readlineSync
    .question("Enter private key (0x...): ")
    .trim();

  let privateKey = pkInput;

  if (!privateKey) {
    console.log("No private key provided.\n");
    process.exit(1);
  }

  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }

  const wallet = new Wallet(privateKey);

  console.log("=== Wallet Imported (Private Key) ===");
  console.log("Address:", wallet.address, "\n");

  await saveWalletEncrypted(wallet);
  return wallet;
}
