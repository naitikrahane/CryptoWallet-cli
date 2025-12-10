import { loadWalletFromDisk } from "./keystore.js";

export async function showAddress() {
  const wallet = await loadWalletFromDisk();
  console.log("Current wallet address:");
  console.log(wallet.address, "\n");
}
