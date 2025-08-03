import * as Sdk from '@1inch/cross-chain-sdk';

export interface RelayerConfig {
  privateKey: string;
  aptosPrivateKey: string;
  aptosAddress: string;
}

export interface ChainState {
  provider: any;
  escrowFactory: string;
  resolver: string;
  wallet: any;
}

export interface CrossChainOrder {
  order: Sdk.CrossChainOrder;
  signature: string;
  orderHash: string;
  status: 'pending' | 'src_escrow_created' | 'dst_escrow_created' | 'security_check_completed' | 'aptos_funds_claimed' | 'funds_sent_to_wallet' | 'cancelled';
  srcEscrowAddress?: string;
  dstEscrowAddress?: string;
  secret?: string;
  createdAt: Date;
  updatedAt: Date;
  stages: {
    srcEscrowCreated?: { txHash: string; timestamp: Date };
    dstEscrowCreated?: { txHash: string; timestamp: Date };
    securityCheckCompleted?: { timestamp: Date };
    aptosFundsClaimed?: { txHash: string; timestamp: Date };
    fundsSentToWallet?: { txHash: string; timestamp: Date };
  };
}

export interface RelayerStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  failedOrders: number;
  totalVolume: bigint;
}

export interface OrderRequest {
  order: any;
  signature: string;
  userAddress: string;
}

export interface OrderResponse {
  success: boolean;
  orderHash: string;
  message?: string;
  error?: string;
}

export interface BalanceResponse {
  src: {
    user: bigint;
    resolver: bigint;
  };
  dst: {
    user: bigint;
    resolver: bigint;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  chains: {
    source: boolean;
    destination: boolean;
    aptos: boolean;
  };
  uptime: number;
  version: string;
} 