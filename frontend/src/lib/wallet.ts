import { useState, useEffect } from 'react';
import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '../wagmi';

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  address: string;
  chain: string;
  formattedBalance: string;
  decimals: number;
}

export interface ChainInfo {
  id: string;
  name: string;
  color: string;
  chainId: number;
  tokens: TokenBalance[];
}

const CHAIN_CONFIGS: Record<string, ChainInfo> = {
  polygon: {
    id: "polygon",
    name: "Polygon",
    color: "#8247E5",
    chainId: 137,
    tokens: [
      {
        symbol: "MATIC",
        name: "Polygon",
        balance: "0",
        address: "0x0000000000000000000000000000000000000000",
        chain: "Polygon",
        formattedBalance: "0",
        decimals: 18,
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        balance: "0",
        address: CONTRACT_ADDRESSES.POLYGON.USDC,
        chain: "Polygon",
        formattedBalance: "0",
        decimals: 6,
      },
      {
        symbol: "USDT",
        name: "Tether USD",
        balance: "0",
        address: CONTRACT_ADDRESSES.POLYGON.USDT,
        chain: "Polygon",
        formattedBalance: "0",
        decimals: 6,
      },
    ],
  },
  base: {
    id: "base",
    name: "Base",
    color: "#0052FF",
    chainId: 8453,
    tokens: [
      {
        symbol: "ETH",
        name: "Ethereum",
        balance: "0",
        address: "0x0000000000000000000000000000000000000000",
        chain: "Base",
        formattedBalance: "0",
        decimals: 18,
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        balance: "0",
        address: CONTRACT_ADDRESSES.BASE.USDC,
        chain: "Base",
        formattedBalance: "0",
        decimals: 6,
      },
      {
        symbol: "USDT",
        name: "Tether USD",
        balance: "0",
        address: CONTRACT_ADDRESSES.BASE.USDT,
        chain: "Base",
        formattedBalance: "0",
        decimals: 6,
      },
    ],
  },
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    color: "#627EEA",
    chainId: 1,
    tokens: [
      {
        symbol: "ETH",
        name: "Ethereum",
        balance: "0",
        address: "0x0000000000000000000000000000000000000000",
        chain: "Ethereum",
        formattedBalance: "0",
        decimals: 18,
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        balance: "0",
        address: CONTRACT_ADDRESSES.ETHEREUM.USDC,
        chain: "Ethereum",
        formattedBalance: "0",
        decimals: 6,
      },
      {
        symbol: "USDT",
        name: "Tether USD",
        balance: "0",
        address: CONTRACT_ADDRESSES.ETHEREUM.USDT,
        chain: "Ethereum",
        formattedBalance: "0",
        decimals: 6,
      },
    ],
  },
};

export function useWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [selectedChain, setSelectedChain] = useState<string>("polygon");
  const [tokenBalances, setTokenBalances] = useState<Record<string, TokenBalance[]>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get current chain config
  const currentChainConfig = CHAIN_CONFIGS[selectedChain];

  // Fetch native token balance
  const { data: nativeBalance } = useBalance({
    address,
  });

  // Fetch USDC balance
  const { data: usdcBalance } = useBalance({
    address,
    token: currentChainConfig?.tokens.find(t => t.symbol === 'USDC')?.address as `0x${string}`,
  });

  // Fetch USDT balance
  const { data: usdtBalance } = useBalance({
    address,
    token: currentChainConfig?.tokens.find(t => t.symbol === 'USDT')?.address as `0x${string}`,
  });

  // Update token balances when balances change
  useEffect(() => {
    if (!currentChainConfig || !address) return;

    const updatedTokens = currentChainConfig.tokens.map(token => {
      let balance = "0";
      let formattedBalance = "0";

      if (token.symbol === 'MATIC' || token.symbol === 'ETH') {
        if (nativeBalance) {
          balance = nativeBalance.value.toString();
          formattedBalance = formatUnits(nativeBalance.value, token.decimals);
        }
      } else if (token.symbol === 'USDC') {
        if (usdcBalance) {
          balance = usdcBalance.value.toString();
          formattedBalance = formatUnits(usdcBalance.value, token.decimals);
        }
      } else if (token.symbol === 'USDT') {
        if (usdtBalance) {
          balance = usdtBalance.value.toString();
          formattedBalance = formatUnits(usdtBalance.value, token.decimals);
        }
      }

      return {
        ...token,
        balance,
        formattedBalance,
      };
    });

    setTokenBalances(prev => ({
      ...prev,
      [selectedChain]: updatedTokens,
    }));
  }, [nativeBalance, usdcBalance, usdtBalance, selectedChain, currentChainConfig, address]);

  const switchToChain = async (chainId: number) => {
    if (switchChain) {
      await switchChain({ chainId });
    }
  };

  const getCurrentChainTokens = () => {
    return tokenBalances[selectedChain] || currentChainConfig?.tokens || [];
  };

  const getAllTokens = () => {
    return Object.values(CHAIN_CONFIGS).map(chain => chain.tokens).flat();
  };

  // Refresh function - triggers a re-fetch of all balances
  const refreshBalances = async () => {
    setIsRefreshing(true);
    try {
      // Force a re-render by updating the state
      // The useEffect will automatically re-fetch balances
      setTokenBalances(prev => ({ ...prev }));
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    address,
    isConnected,
    chainId,
    selectedChain,
    setSelectedChain,
    currentChainConfig,
    tokenBalances,
    getCurrentChainTokens,
    getAllTokens,
    switchToChain,
    chains: Object.values(CHAIN_CONFIGS),
    refreshBalances,
    isRefreshing,
  };
} 