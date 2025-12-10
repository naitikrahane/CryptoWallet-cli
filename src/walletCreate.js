// Create a new random wallet, display seed + address, and encrypt it.

import { Wallet } from "ethers";
import { saveWalletEncrypted } from "./keystore.js";

// Generate a new wallet and save it as the active keystore.
// Returns the in-memory wallet instance so the session can reuse it.
export async function walletCreate() {
  const wallet = Wallet.createRandom();

  console.log("=== New Wallet Generated ===");
  console.log("Address:  ", wallet.address);
  console.log("Mnemonic: ", wallet.mnemonic?.phrase || "(no mnemonic)");
  console.log(
    "\nWrite this mnemonic on paper and store it safely. Anyone with it can access your funds.\n"
  );

  await saveWalletEncrypted(wallet);
  return wallet;
}
