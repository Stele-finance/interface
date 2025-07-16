# WalletConnect Setup Guide

Follow these steps to use the WalletConnect functionality:

## 1. Create WalletConnect Project

1. Visit https://cloud.walletconnect.com/
2. Create a new project
3. Copy the project ID

## 2. Environment Variables Setup

Create a `.env.local` file and add the following content:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

## 3. Add WalletConnect Logo (Optional)

You can add a `public/wallets/small/walletconnect.png` file to display a dedicated WalletConnect logo.

## 4. Usage

In mobile browser:
1. Click "Connect Wallet" button
2. Select "WalletConnect" option
3. When QR code appears, scan it with your mobile wallet app
4. Approve the connection in your wallet app

Supported Mobile Wallets:
- MetaMask Mobile
- Trust Wallet
- Rainbow Wallet
- Coinbase Wallet
- Other WalletConnect compatible wallets

## Important Notes

- WalletConnect supports Ethereum and Arbitrum networks
- Solana network is not supported
- Internet connection is required 