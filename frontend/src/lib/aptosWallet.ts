import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Type definition for APT coin resource
type Coin = { coin: { value: string } };

// Type definition for Indexer response
type IndexerResponse = {
    current_fungible_asset_balances: Array<{
      asset_type: string;
      amount: string;
      __typename: string;
    }>;
};

export interface AptosTokenBalance {
  symbol: string;
  name: string;
  balance: string;
  address: string;
  chain: string;
  formattedBalance: string;
  decimals: number;
}

// Aptos tokens with correct addresses
const APTOS_TOKENS: AptosTokenBalance[] = [
  {
    symbol: "APT",
    name: "Aptos",
    balance: "0",
    address: "0x1::aptos_coin::AptosCoin",
    chain: "Aptos",
    formattedBalance: "0",
    decimals: 8,
  },
  {
    symbol: "FUSION",
    name: "Fusion Token",
    balance: "0",
    address: "0xb56bbecb1105320f538c98931eb637eb216e977bc4c6b83504c43663f4e6b923::fusion_token::FusionToken",
    chain: "Aptos",
    formattedBalance: "0",
    decimals: 8,
  },
];

// Initialize Aptos client
const aptosConfig = new AptosConfig({ network: Network.MAINNET });
const aptos = new Aptos(aptosConfig);

// Function to fetch all token balances from Aptos blockchain using Indexer API
async function fetchAllTokenBalances(accountAddress: string): Promise<AptosTokenBalance[]> {
  try {
    console.log('Fetching balances for address:', accountAddress);
    
    // Query fungible asset balances using Indexer API
    const response = await aptos.queryIndexer<IndexerResponse>({
      query: {
        query: `
          query GetFungibleAssetBalances($address: String, $offset: Int, $token_standard: String) {
            current_fungible_asset_balances(
              where: {owner_address: {_eq: $address}, token_standard: {_eq: $token_standard}}
              offset: $offset
              limit: 100
              order_by: {amount: desc}
            ) {
              asset_type
              amount
              __typename
            }
          }
        `,
        variables: {
          address: accountAddress,
          offset: 0,
          token_standard: "v1"
        }
      }
    });

    console.log('Indexer response:', response);

    // Create a map of asset types to amounts
    const balanceMap = new Map<string, string>();
    
    if (response && response.current_fungible_asset_balances) {
      response.current_fungible_asset_balances.forEach((balance: any) => {
        console.log(`Found balance for ${balance.asset_type}: ${balance.amount}`);
        balanceMap.set(balance.asset_type, balance.amount.toString());
      });
    }

    // Update our token list with real balances from indexer
    const updatedTokens = APTOS_TOKENS.map((token) => {
      let balance = "0";
      
      if (token.symbol === "APT") {
        // Get APT balance from indexer
        const aptAssetType = "0x1::aptos_coin::AptosCoin";
        balance = balanceMap.get(aptAssetType) || "0";
        console.log(`APT balance from indexer: ${balance}`);
      } else if (token.symbol === "FUSION") {
        // Get FUSION balance from indexer
        const fusionAssetType = "0xb56bbecb1105320f538c98931eb637eb216e977bc4c6b83504c43663f4e6b923::fusion_token::FusionToken";
        balance = balanceMap.get(fusionAssetType) || "0";
        console.log(`FUSION balance from indexer: ${balance}`);
      }
      
      const formattedBalance = balance === "0" ? "0" : (Number(balance) / Math.pow(10, token.decimals)).toFixed(token.decimals);
      console.log(`${token.symbol} formatted balance: ${formattedBalance}`);
      
      return {
        ...token,
        balance,
        formattedBalance,
      };
    });
    
    return updatedTokens;
  } catch (error) {
    console.error('Error fetching token balances from indexer:', error);
    
    // Fallback to getAccountResource method if indexer fails
    try {
      const updatedTokens = await Promise.all(
        APTOS_TOKENS.map(async (token) => {
          let balance = "0";
          
          try {
            if (token.symbol === "APT") {
              const resource = await aptos.getAccountResource<Coin>({
                accountAddress,
                resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
              });
              balance = resource.coin.value;
              console.log(`APT balance from fallback: ${balance}`);
            } else if (token.symbol === "FUSION") {
              const resource = await aptos.getAccountResource<Coin>({
                accountAddress,
                resourceType: "0x1::coin::CoinStore<0xb56bbecb1105320f538c98931eb637eb216e977bc4c6b83504c43663f4e6b923::fusion_token::FusionToken>",
              });
              balance = resource.coin.value;
              console.log(`FUSION balance from fallback: ${balance}`);
            }
          } catch (resourceError) {
            console.log(`No ${token.symbol} balance found for account ${accountAddress}:`, resourceError);
          }
          
          const formattedBalance = balance === "0" ? "0" : (Number(balance) / Math.pow(10, token.decimals)).toFixed(token.decimals);
          console.log(`${token.symbol} formatted balance (fallback): ${formattedBalance}`);
          
          return {
            ...token,
            balance,
            formattedBalance,
          };
        })
      );
      
      return updatedTokens;
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
      // Return tokens with 0 balances on error
      return APTOS_TOKENS.map(token => ({
        ...token,
        balance: "0",
        formattedBalance: "0",
      }));
    }
  }
}

export function useAptosWallet() {
  const { account, connected } = useWallet();
  const [tokenBalances, setTokenBalances] = useState<AptosTokenBalance[]>(APTOS_TOKENS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to fetch balances
  const fetchBalances = async () => {
    if (connected && account?.address) {
      const updatedTokens = await fetchAllTokenBalances(account.address.toString());
      setTokenBalances(updatedTokens);
    } else {
      setTokenBalances(APTOS_TOKENS.map(token => ({
        ...token,
        formattedBalance: "0",
      })));
    }
  };

  // Fetch dynamic balances from Aptos blockchain
  useEffect(() => {
    fetchBalances();
  }, [connected, account?.address]);

  // Refresh function
  const refreshBalances = async () => {
    setIsRefreshing(true);
    try {
      await fetchBalances();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getAptosTokens = () => {
    return tokenBalances;
  };

  return {
    account,
    connected,
    getAptosTokens,
    refreshBalances,
    isRefreshing,
  };
} 