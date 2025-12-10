// Encrypted wallet keystore handling: save, load, delete.

import fs from "fs";
import readlineSync from "readline-sync";
import { Wallet } from "ethers";
import { KEYSTORE_PATH } from "./config.js";

// Check if an encrypted wallet file already exists.
export function keystoreExists() {
  return fs.existsSync(KEYSTORE_PATH);
}

// Ask for a password in the terminal without echoing characters.
export function askPassword(promptText = "Password: ") {
  const pwd = readlineSync.question(promptText, { hideEchoBack: true });
  return pwd.trim();
}

// Save an in-memory wallet to an encrypted JSON keystore on disk.
// If a keystore exists, ask for confirmation and create a backup.
export async function saveWalletEncrypted(wallet) {
  if (keystoreExists()) {
    console.log("Existing wallet found at:");
    console.log("  ", KEYSTORE_PATH);
    const ans = readlineSync
      .question("Overwrite existing wallet? (y/N): ")
      .trim()
      .toLowerCase();

    if (ans !== "y") {
      console.log("Aborting. Existing wallet preserved.\n");
      process.exit(0);
    }

    // Backup old file with timestamp before overwriting.
    const backupPath = KEYSTORE_PATH + "." + Date.now() + ".bak";
    fs.copyFileSync(KEYSTORE_PATH, backupPath);
    console.log("Old wallet backup saved as:");
    console.log("  ", backupPath, "\n");
  }

  const pwd1 = askPassword("New wallet password: ");
  const pwd2 = askPassword("Confirm password: ");

  if (!pwd1 || pwd1 !== pwd2) {
    console.log("Passwords do not match or are empty.");
    process.exit(1);
  }

  console.log("\nEncrypting & saving wallet...");
  const json = await wallet.encrypt(pwd1); // Strong scrypt-based encryption.

  fs.writeFileSync(KEYSTORE_PATH, json, { encoding: "utf8", flag: "w" });
  console.log("Saved keystore at:", KEYSTORE_PATH, "\n");
}

// Load wallet from encrypted keystore using a password prompt.
// Exits on wrong password or missing keystore.
export async function loadWalletFromDisk() {
  if (!keystoreExists()) {
    console.log("No wallet found. Create or import a wallet first.");
    process.exit(1);
  }

  const json = fs.readFileSync(KEYSTORE_PATH, "utf8");
  const password = askPassword("Wallet password: ");

  try {
    const wallet = await Wallet.fromEncryptedJson(json, password);
    return wallet;
  } catch {
    console.log("Wrong password or corrupted wallet file.");
    process.exit(1);
  }
}

// Delete the keystore file after explicit confirmation.
export function deleteWallet() {
  if (!keystoreExists()) {
    console.log("No wallet file to delete.\n");
    return;
  }

  console.log("This will delete the encrypted wallet file:");
  console.log("  ", KEYSTORE_PATH);
  console.log("Without the seed phrase, funds cannot be recovered.");
  const ans = readlineSync
    .question("Type 'DELETE' to confirm: ")
    .trim()
    .toUpperCase();

  if (ans !== "DELETE") {
    console.log("Delete cancelled.\n");
    return;
  }

  fs.unlinkSync(KEYSTORE_PATH);
  console.log("Wallet file deleted.\n");
}
