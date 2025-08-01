# Fusion Plus Frontend

A cross-chain token swap interface with wallet integration.

## Features

- **Wallet Connection**: Integrated with RainbowKit for seamless wallet connection
- **Cross-Chain Swapping**: Support for Polygon, Base, and Ethereum networks
- **Token Balance Display**: Real-time token balance fetching
- **Token Selection**: Dropdown menus for selecting USDC, USDT, and native tokens
- **Light Mode UI**: Clean, modern interface

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure WalletConnect**:
   - Get a project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Update the `projectId` in `src/wagmi.ts`

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Wallet Integration

The app uses:
- **Wagmi**: For Ethereum interactions
- **RainbowKit**: For wallet connection UI
- **Viem**: For blockchain interactions

### Supported Networks
- Polygon (Chain ID: 137)
- Base (Chain ID: 8453)
- Ethereum (Chain ID: 1)

### Supported Tokens
- **USDC**: `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
- **USDT**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **Native Tokens**: MATIC (Polygon), ETH (Base/Ethereum)

## Usage

1. Connect your wallet using the "Connect Wallet" button
2. Select tokens for the swap (from current chain and to any chain)
3. Enter the amount you want to swap
4. Click "Swap" to execute the transaction

## Development

The main components are:
- `src/swap.tsx`: Main swap interface
- `src/lib/wallet.ts`: Wallet integration hook
- `src/wagmi.ts`: Wagmi configuration
- `src/App.tsx`: App wrapper with providers
