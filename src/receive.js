// Display the receive address and show a QR code in the terminal.

import qrcode from "qrcode-terminal";
import { loadWalletFromDisk } from "./keystore.js";

// Show receive address and QR for the given wallet.
// If wallet is not provided, falls back to loading from disk (not typical in session mode).
export async function receiveAddress(wallet) {
  let w = wallet;
  if (!w) {
    w = await loadWalletFromDisk();
  }

  console.log("Use this address to receive funds:\n");
  console.log(w.address, "\n");

  console.log("Scan this QR code:\n");
  qrcode.generate(w.address, { small: true });
  console.log();
}
