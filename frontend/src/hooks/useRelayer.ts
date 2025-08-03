import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { BrowserRelayerClient } from '@/lib/relayer-client';

export function useRelayer(baseUrl?: string) {
  const [relayer] = useState(() => new BrowserRelayerClient(baseUrl));
  const [isConnected, setIsConnected] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const { address, chainId } = useAccount();
  const { signTypedData } = useSignTypedData();
  const { signAndSubmitTransaction, account } = useWallet();

  // Connect to WebSocket on mount
  useEffect(() => {
    relayer.connectWebSocket();
    
    relayer.on('connected', () => {
      setIsConnected(true);
    });

    relayer.on('order_submitted', (data: { orderHash: any; }) => {
      console.log('Order submitted:', data.orderHash);
      setCurrentOrder({ orderHash: data.orderHash, status: 'pending' });
      // Refresh orders list
    });

    relayer.on('order_completed', (data: { orderHash: any; }) => {
      console.log('Order completed:', data.orderHash);
      setCurrentOrder((prev: any) => prev?.orderHash === data.orderHash ? { ...prev, status: 'funds_sent_to_wallet' } : prev);
    });

    relayer.on('order_status_updated', (data: { orderHash: any; status: any; stages: any; }) => {
      console.log('Order status updated:', data);
      setCurrentOrder((prev: any) => {
        if (prev?.orderHash === data.orderHash) {
          const updatedOrder = { ...prev, status: data.status, stages: data.stages };
          
          // Log transaction links when stages are updated
          if (data.stages) {
            console.log('=== TRANSACTION LINKS ===');
            if (data.stages.srcEscrowCreated?.txHash) {
              console.log(`Source Escrow Deployment: https://basescan.org/tx/${data.stages.srcEscrowCreated.txHash}`);
            }
            if (data.stages.dstEscrowCreated?.txHash) {
              console.log(`Aptos Escrow Funding: https://explorer.aptoslabs.com/txn/${data.stages.dstEscrowCreated.txHash}?network=mainnet`);
            }
            if (data.stages.aptosFundsClaimed?.txHash) {
              console.log(`Aptos Funds Claiming: https://explorer.aptoslabs.com/txn/${data.stages.aptosFundsClaimed.txHash}?network=mainnet`);
            }
            if (data.stages.fundsSentToWallet?.txHash) {
              console.log(`Base Funds Withdrawal: https://basescan.org/tx/${data.stages.fundsSentToWallet.txHash}`);
            }
            console.log('=== END TRANSACTION LINKS ===');
          }
          
          return updatedOrder;
        }
        return prev;
      });
    });

    return () => {
      relayer.disconnectWebSocket();
    };
  }, [relayer]);

  const createCrossChainOrder = useCallback(async (orderData: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    fromChainId: number;
    toChainId: number;
  }) => {
    if (!address || !chainId) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Send order data to server - SDK logic moved to server
      const orderRequest = {
        orderData,
        userAddress: address,
        chainId: chainId
      };

      // Submit to relayer - server will handle SDK logic
      const result = await relayer.submitOrder(orderRequest, '', address);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address, chainId, relayer]);

  const createAptosOrder = useCallback(async (orderData: {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
  }) => {
    if (!account) {
      throw new Error('Aptos wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Create Aptos-specific order
      // This would need to be implemented based on the Aptos SDK
      const order = {
        // Aptos order structure
        fromToken: orderData.fromToken,
        toToken: orderData.toToken,
        fromAmount: orderData.fromAmount,
        toAmount: orderData.toAmount,
      };
      
      // Sign with Aptos wallet - using a mock signature for now
      const signature = '0x1234567890abcdef'; // Mock signature - implement proper signing
      
      // Submit to relayer
      const result = await relayer.submitOrder(order, signature, account.address.toString());
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [account, signAndSubmitTransaction, relayer]);

  const getOrderStatus = useCallback(async (orderHash: string) => {
    try {
      return await relayer.getOrderStatus(orderHash);
    } catch (err) {
      console.error('Error getting order status:', err);
      throw err;
    }
  }, [relayer]);

  const checkHealth = useCallback(async () => {
    try {
      return await relayer.getHealth();
    } catch (err) {
      console.error('Error checking health:', err);
      throw err;
    }
  }, [relayer]);

  const reconnect = useCallback(async () => {
    try {
      console.log('Reconnecting to relayer...');
      setIsConnected(false);
      setError(null);
      
      // Disconnect current WebSocket
      relayer.disconnectWebSocket();
      
      // Wait a moment before reconnecting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reconnect WebSocket
      relayer.connectWebSocket();
      
      console.log('Relayer reconnection initiated');
    } catch (err) {
      console.error('Error reconnecting to relayer:', err);
      setError('Failed to reconnect to relayer');
    }
  }, [relayer]);

  return {
    // State
    isConnected,
    orders,
    stats,
    loading,
    error,
    currentOrder,
    
    // Methods
    createCrossChainOrder,
    createAptosOrder,
    getOrderStatus,
    checkHealth,
    reconnect,

    // Client instance
    relayer,
  };
} 