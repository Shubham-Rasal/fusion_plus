import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, base, mainnet, optimism, polygon } from 'wagmi/chains';

// Contract addresses from config.ts
export const CONTRACT_ADDRESSES = {
  POLYGON: {
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    MATIC: '0x0000000000000000000000000000000000000000', // Native token
  },
  BASE: {
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    ETH: '0x0000000000000000000000000000000000000000', // Native token
  },
  ETHEREUM: {
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    ETH: '0x0000000000000000000000000000000000000000', // Native token
  },
} as const;

export const config = getDefaultConfig({
  appName: 'Fusion Plus Swap',
  projectId: '308576a0e081b280b26e1d3cd435f10b', // Replace with your WalletConnect project ID
  chains: [mainnet, polygon, optimism, arbitrum, base],
});
