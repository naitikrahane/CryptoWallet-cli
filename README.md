# cli-wallet

Simple non-custodial EVM CLI wallet.

- Encrypted keystore on local disk
- Multiple RPC networks (EVM)
- Native coin send (ETH, BNB, MATIC, etc.)
- ERC-20 token import, balance, and send
- QR code for receive address

## Install

```bash
git clone https://github.com/<your-username>/cli-wallet.git
cd cli-wallet
npm install
npm start (start)

**## SECURITY NOTE**
Wallet is non-custodial

Private keys are never sent to any server

Keystore is encrypted with password

Still: if device has malware / keylogger, nothing is 100% safe
