import { JsonRpcProvider, ContractFactory, Wallet as SignerWallet, ethers, MaxUint256 } from "ethers";
import * as Sdk from "@1inch/cross-chain-sdk";
import { config } from "./config";
import { RelayerWallet } from "./wallet";
import { RelayerResolver } from "./resolver";
import { AptosRelayerClient } from "./aptos-client";
import { EscrowFactory } from "./escrow-factory";
import { CrossChainOrder, RelayerStats, ChainState } from "./types";
import factoryContract from "../../eth/dist/contracts/TestEscrowFactory.sol/TestEscrowFactory.json";
import resolverContract from "../../eth/dist/contracts/Resolver.sol/Resolver.json";
export class CrossChainRelayer {
  private srcChain!: ChainState;
  private dstChain!: ChainState;
  private aptosClient: AptosRelayerClient;
  private srcFactory!: EscrowFactory;
  private dstFactory!: EscrowFactory;
  private orders: Map<string, CrossChainOrder> = new Map();
  private startTime: number = Date.now();
  private onOrderUpdate?: (orderHash: string, status: string, stages?: any) => void;

  constructor() {
    this.aptosClient = new AptosRelayerClient(
      config.relayer.aptosPrivateKey,
      config.relayer.aptosAddress
    );
  }

  setOrderUpdateCallback(callback: (orderHash: string, status: string, stages?: any) => void) {
    this.onOrderUpdate = callback;
  }

  private emitOrderUpdate(orderHash: string, status: string, stages?: any) {
    if (this.onOrderUpdate) {
      this.onOrderUpdate(orderHash, status, stages);
    }
  }

  async initialize(): Promise<void> {
    console.log("Initializing Cross-Chain Relayer...");
    
    // Initialize source chain
    this.srcChain = await this.initChain(config.chain.source);
    console.log(`Source chain initialized: ${config.chain.source.chainId}`);
    
    // Initialize destination chain
    this.dstChain = await this.initChain(config.chain.destination);
    console.log(`Destination chain initialized: ${config.chain.destination.chainId}`);
    
    // Initialize EscrowFactory instances
    this.srcFactory = new EscrowFactory(this.srcChain.provider, this.srcChain.escrowFactory);
    this.dstFactory = new EscrowFactory(this.dstChain.provider, this.dstChain.escrowFactory);
    console.log("EscrowFactory instances initialized");
    
    // Initialize Aptos swap ledger (like in test)
    console.log("Initializing Aptos swap ledger...");
    await this.aptosClient.initializeSwapLedger();
    console.log("Aptos swap ledger initialized");
    
    console.log("Cross-Chain Relayer initialized successfully");
  }

  async processOrder(orderRequest: any): Promise<string> {
    const { order, signature, userAddress } = orderRequest;
    
    // The order should already be a CrossChainOrder instance from the frontend
    const orderHash = order.getOrderHash(config.chain.source.chainId);
    
    // Store order
    const storedOrder: CrossChainOrder = {
      order: order,
      signature,
      orderHash,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      stages: {}
    };
    
    this.orders.set(orderHash, storedOrder);
    
    // Process the order asynchronously
    this.processOrderAsync(orderHash).catch(error => {
      console.error(`Error processing order ${orderHash}:`, error);
      const order = this.orders.get(orderHash);
      if (order) {
        order.status = 'cancelled';
        order.updatedAt = new Date();
      }
    });
    
    return orderHash;
  }

  async processOrderFromData(orderRequest: any): Promise<string> {
    // Hardcoded test implementation based on main.spec.ts
    console.log("Running hardcoded test from main.spec.ts...");
    
    // Check if relayer is initialized
    if (!this.srcChain || !this.dstChain) {
      throw new Error('Relayer not initialized. Please wait for initialization to complete.');
    }
    
    // Get the relayer's address as the maker (like srcChainUser in test)
    const makerAddress = await this.srcChain.wallet.getAddress();
    
    // TOP UP USER AND RESOLVER CONTRACTS WITH TOKENS (like in main.spec.ts)
    console.log("Topping up user and resolver contracts with tokens...");
    
    // Get 0.1 USDC for user in SRC chain and approve to LOP
    await this.srcChain.wallet.topUpFromDonor(
      config.chain.source.tokens.USDC.address,
      config.chain.source.tokens.USDC.donor,
      ethers.parseUnits("0.1", 6)
    );
    await this.srcChain.wallet.approveToken(
      config.chain.source.tokens.USDC.address,
      config.chain.source.limitOrderProtocol,
      MaxUint256
    );
    
    console.log("User tokens topped up and approved for LOP");
    
    // Get 0.1 USDC for resolver in DST chain
    const srcResolverContract = await RelayerWallet.fromAddress(
      this.srcChain.resolver,
      this.srcChain.provider
    );
    const dstResolverContract = await RelayerWallet.fromAddress(
      this.dstChain.resolver,
      this.dstChain.provider
    );
    
    await dstResolverContract.topUpFromDonor(
      config.chain.destination.tokens.USDC.address,
      config.chain.destination.tokens.USDC.donor,
      ethers.parseUnits("0.1", 6)
    );
    
    // Top up contract for approve
    await this.dstChain.wallet.transfer(this.dstChain.resolver, ethers.parseEther("1"));
    await dstResolverContract.unlimitedApprove(
      config.chain.destination.tokens.USDC.address,
      this.dstChain.escrowFactory
    );
    
    console.log("Resolver contracts topped up and approved");
    
    // Create secret exactly like in the test file
    const secretBytes = ethers.toUtf8Bytes("my_secret_password_for_swap_test");
    const secret = ethers.hexlify(secretBytes); // This gives us the 32-byte hex string
    
    // Get current timestamp like in test
    const srcTimestamp = BigInt(Math.floor(Date.now() / 1000));
    
    // Create the cross-chain order exactly like in test file
    const order = Sdk.CrossChainOrder.new(
      new Sdk.Address(this.srcChain.escrowFactory),
      {
        salt: Sdk.randBigInt(10n),
        maker: new Sdk.Address(makerAddress),
        makingAmount: ethers.parseUnits("0.1", 6),
        takingAmount: ethers.parseUnits("0.1", 6),
        makerAsset: new Sdk.Address(config.chain.source.tokens.USDC.address),
        takerAsset: new Sdk.Address(config.chain.destination.tokens.USDC.address),
      },
      {
        hashLock: Sdk.HashLock.forSingleFill(secret),
        timeLocks: Sdk.TimeLocks.new({
          srcWithdrawal: 10n, // 10sec finality lock for test
          srcPublicWithdrawal: 120n, // 2m for private withdrawal
          srcCancellation: 121n, // 1sec public withdrawal
          srcPublicCancellation: 122n, // 1sec private cancellation
          dstWithdrawal: 10n, // 10sec finality lock for test
          dstPublicWithdrawal: 100n, // 100sec private withdrawal
          dstCancellation: 101n, // 1sec public withdrawal
        }),
        srcChainId: Sdk.NetworkEnum.COINBASE,
        dstChainId: Sdk.NetworkEnum.ETHEREUM, // temporary, should add aptos to supported chains
        srcSafetyDeposit: ethers.parseEther("0.001"),
        dstSafetyDeposit: ethers.parseEther("0.001"),
      },
      {
        auction: new Sdk.AuctionDetails({
          initialRateBump: 0,
          points: [],
          duration: 120n,
          startTime: srcTimestamp,
        }),
        whitelist: [
          {
            address: new Sdk.Address(this.srcChain.resolver),
            allowFrom: 0n,
          },
        ],
        resolvingStartTime: 0n,
      },
      {
        nonce: Sdk.randBigInt(1000n),
        allowPartialFills: false,
        allowMultipleFills: false,
      }
    );
    
    // Sign order exactly like in test file
    const signature = await this.srcChain.wallet.signOrder(Sdk.NetworkEnum.COINBASE, order);
    const orderHash = order.getOrderHash(Sdk.NetworkEnum.COINBASE);
    
    console.log(`Order created and signed: ${orderHash}`);
    
    // Store order
    const storedOrder: CrossChainOrder = {
      order: order,
      signature: signature,
      orderHash,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      stages: {}
    };
    
    this.orders.set(orderHash, storedOrder);
    
    // Process the order asynchronously
    this.processOrderAsync(orderHash).catch(error => {
      console.error(`Error processing order ${orderHash}:`, error);
      const order = this.orders.get(orderHash);
      if (order) {
        order.status = 'cancelled';
        order.updatedAt = new Date();
        this.emitOrderUpdate(orderHash, 'cancelled');
      }
    });
    
    return orderHash;
  }

  private async processOrderAsync(orderHash: string): Promise<void> {
    const order = this.orders.get(orderHash);
    if (!order) throw new Error(`Order ${orderHash} not found`);

    try {
      // Get the stored order and signature
      const storedOrder = order.order;
      const signature = order.signature;
      const srcChainId = Sdk.NetworkEnum.COINBASE; // Base chain
      const dstChainId = Sdk.NetworkEnum.BINANCE; // Aptos (using BINANCE as placeholder)
      
      // Create resolver contract exactly like in test
      const resolverContract = new RelayerResolver(
        this.srcChain.resolver,
        this.dstChain.resolver
      );

     
      console.log("Initial balances:", await this.getBalances());
      
      console.log(`[${srcChainId}]`, `Filling order ${orderHash}`);
      const fillAmount = storedOrder.makingAmount;
      
      // Deploy source escrow exactly like in test
      const { txHash: orderFillHash, blockHash: srcDeployBlock } = await this.srcChain.wallet.send(
        resolverContract.deploySrc(
          srcChainId,
          storedOrder,
          signature,
          Sdk.TakerTraits.default()
            .setExtension(storedOrder.extension)
            .setAmountMode(Sdk.AmountMode.maker)
            .setAmountThreshold(storedOrder.takingAmount),
          fillAmount
        )
      );
      
      console.log(
        `[${srcChainId}]`,
        `Order ${orderHash} filled for ${fillAmount} in tx https://basescan.org/tx/${orderFillHash}`
      );
      
      // Update order status and emit update
      order.status = 'src_escrow_created';
      order.updatedAt = new Date();
      order.stages.srcEscrowCreated = { txHash: orderFillHash, timestamp: new Date() };
      this.emitOrderUpdate(orderHash, 'src_escrow_created', order.stages);
      
      // Get escrow event from deployment block
      const srcEscrowEvent = await this.getSrcDeployEvent(srcDeployBlock);
      console.log("Source escrow event:", srcEscrowEvent);
      
      // Create destination immutables 
      const dstImmutables = srcEscrowEvent[0]
        .withComplement(srcEscrowEvent[1])
        .withTaker(new Sdk.Address(resolverContract.dstAddress));
      
      console.log(
        `[${dstChainId}]`,
        `Depositing ${dstImmutables.amount} for order ${orderHash}`
      );
      
      // FUND ESCROW ON APTOS (like in test)
      console.log("Funding destination escrow on Aptos...");
      const aptosFundingResult = await this.fundDstEscrowOnAptos(BigInt(1000000)); // 0.1 USDC (6 decimals)
      
      // Update order status and emit update
      order.status = 'dst_escrow_created';
      order.updatedAt = new Date();
      order.stages.dstEscrowCreated = { txHash: aptosFundingResult, timestamp: new Date() };
      this.emitOrderUpdate(orderHash, 'dst_escrow_created', order.stages);
      
      // Get escrow addresses exactly like in test
      const ESCROW_SRC_IMPLEMENTATION = await this.getSourceImpl();
      const ESCROW_DST_IMPLEMENTATION = "ESCROW_DST_IMPLEMENTATION";
      
      const srcEscrowAddress = new Sdk.EscrowFactory(
        new Sdk.Address(this.srcChain.escrowFactory)
      ).getSrcEscrowAddress(srcEscrowEvent[0], ESCROW_SRC_IMPLEMENTATION);
      
      console.log(`Source escrow address: ${srcEscrowAddress}`);
      
      // Increase time for time locks (like in test)
      await this.increaseTime(11);
      console.log("Time increased by 11 seconds");
      
      // Update order status and emit update
      order.status = 'security_check_completed';
      order.updatedAt = new Date();
      order.stages.securityCheckCompleted = { timestamp: new Date() };
      this.emitOrderUpdate(orderHash, 'security_check_completed', order.stages);
      
      // Unlock funds on dst chain for user (Aptos)
      console.log("Claiming funds on Aptos...");
      const aptosClaimResult = await this.claimFundsOnAptos();
      
      // Update order status and emit update
      order.status = 'aptos_funds_claimed';
      order.updatedAt = new Date();
      order.stages.aptosFundsClaimed = { txHash: aptosClaimResult, timestamp: new Date() };
      this.emitOrderUpdate(orderHash, 'aptos_funds_claimed', order.stages);
      
      // Withdraw funds from source chain for resolver exactly like in test
      console.log(
        `[${srcChainId}]`,
        `Withdrawing funds for resolver from ${srcEscrowAddress}`
      );
      
      const { txHash: resolverWithdrawHash } = await this.srcChain.wallet.send(
        resolverContract.withdraw(
          "src",
          srcEscrowAddress,
          order.secret || "0x6d795f7365637265745f70617373776f72645f666f725f737761705f74657374",
          srcEscrowEvent[0]
        )
      );
      
      console.log(
        `[${srcChainId}]`,
        `Withdrew funds for resolver from ${srcEscrowAddress} to ${this.srcChain.resolver} in tx https://basescan.org/tx/${resolverWithdrawHash}`
      );
      
      // Get final balances
      const balances = await this.getBalances();
      console.log("Final balances:", balances);
      
      // Format balances for human readability
      const formatBalance = (balance: bigint) => {
        return (Number(balance) / 1_000_000).toFixed(6); // USDC has 6 decimals
      };
      
      console.log("=== FINAL BALANCES (USDC) ===");
      console.log(`Source Chain (Base):`);
      console.log(`  User: ${formatBalance(balances.src.user)} USDC`);
      console.log(`  Resolver: ${formatBalance(balances.src.resolver)} USDC`);
      console.log(`Destination Chain (Aptos):`);
      console.log(`  User: ${formatBalance(balances.dst.user)} USDC`);
      console.log(`  Resolver: ${formatBalance(balances.dst.resolver)} USDC`);
      console.log("================================");
      
      // Update order status
      order.status = 'funds_sent_to_wallet';
      order.updatedAt = new Date();
      order.stages.srcEscrowCreated = { txHash: orderFillHash, timestamp: new Date() };
      order.stages.dstEscrowCreated = { txHash: aptosFundingResult, timestamp: new Date() };
      order.stages.aptosFundsClaimed = { txHash: aptosClaimResult, timestamp: new Date() };
      order.stages.fundsSentToWallet = { txHash: resolverWithdrawHash, timestamp: new Date() };
      
      this.emitOrderUpdate(orderHash, 'funds_sent_to_wallet', order.stages);
      
      console.log("=== TRANSACTION LINKS ===");
      console.log(`Source Escrow Deployment: https://basescan.org/tx/${orderFillHash}`);
      console.log(`Source Funds Withdrawal: https://basescan.org/tx/${resolverWithdrawHash}`);
      console.log(`Aptos Escrow Funding: https://explorer.aptoslabs.com/txn/${aptosFundingResult}?network=mainnet`);
      console.log(`Aptos Funds Claiming: https://explorer.aptoslabs.com/txn/${aptosClaimResult}?network=mainnet`);
      console.log("=== END TRANSACTION LINKS ===");
      
    } catch (error) {
      console.error(`Error in fill test for ${orderHash}:`, error);
      order.status = 'cancelled';
      order.updatedAt = new Date();
      this.emitOrderUpdate(orderHash, 'cancelled');
      throw error;
    }
  }

  
  private async withdrawSrcFunds(order: CrossChainOrder): Promise<{ txHash: string }> {
    if (!order.secret || !order.srcEscrowAddress) {
      throw new Error("Missing secret or escrow address for withdrawal");
    }

    const resolver = new RelayerResolver(
      this.srcChain.resolver,
      this.dstChain.resolver
    );

    const withdrawTx = resolver.withdraw(
      'src',
      new Sdk.Address(order.srcEscrowAddress),
      order.secret,
      order.order.toSrcImmutables(
        config.chain.source.chainId,
        new Sdk.Address(this.srcChain.resolver),
        order.order.makingAmount,
        order.order.escrowExtension.hashLockInfo
      )
    );

    const result = await this.srcChain.wallet.send(withdrawTx);
    console.log(`Source funds withdrawn: ${result.txHash}`);
    return { txHash: result.txHash };
  }

  private getSrcEscrowAddress(order: Sdk.CrossChainOrder, blockHash: string): string {
    // This is a simplified version - in production you'd parse the event logs
    const escrowFactory = new Sdk.EscrowFactory(new Sdk.Address(this.srcChain.escrowFactory));
    const ESCROW_SRC_IMPLEMENTATION = "0x0000000000000000000000000000000000000000"; // Placeholder
    return escrowFactory.getSrcEscrowAddress(
      order.toSrcImmutables(
        config.chain.source.chainId,
        new Sdk.Address(this.srcChain.resolver),
        order.makingAmount,
        order.escrowExtension.hashLockInfo
      ),
      new Sdk.Address(ESCROW_SRC_IMPLEMENTATION)
    ).toString();
  }

  private async initChain(chainConfig: any): Promise<ChainState> {
    const { provider } = await this.getProvider(chainConfig);
    const deployer = new SignerWallet(chainConfig.ownerPrivateKey, provider);
    
    console.log(`Deployer address: ${deployer.address}`);

    // Deploy EscrowFactory
    const escrowFactory = await this.deploy(
      factoryContract,
      [
        chainConfig.limitOrderProtocol,
        chainConfig.wrappedNative,
        Sdk.Address.fromBigInt(0n).toString(),
        deployer.address,
        60 * 30, // src rescue delay
        60 * 30, // dst rescue delay
      ],
      provider,
      deployer
    );

    // Deploy Resolver contract
    const resolver = await this.deploy(
      resolverContract,
      [
        escrowFactory,
        chainConfig.limitOrderProtocol,
        deployer.address, // resolver as owner
      ],
      provider,
      deployer
    );

    const wallet = new RelayerWallet(chainConfig.ownerPrivateKey, provider);

    return {
      provider,
      escrowFactory,
      resolver,
      wallet
    };
  }

  private async getProvider(chainConfig: any): Promise<{ provider: JsonRpcProvider }> {
    if (!chainConfig.createFork) {
      return {
        provider: new JsonRpcProvider(chainConfig.url, chainConfig.chainId, {
          cacheTimeout: -1,
          staticNetwork: true,
        }),
      };
    }

    const provider = new JsonRpcProvider(chainConfig.rpcUrl, chainConfig.chainId, {
      cacheTimeout: -1,
      staticNetwork: true,
    });

    return { provider };
  }

  private async deploy(
    json: { abi: any; bytecode: any },
    params: unknown[],
    provider: JsonRpcProvider,
    deployer: SignerWallet
  ): Promise<string> {
    const nonce = await provider.getTransactionCount(deployer.address);
    const deployed = await new ContractFactory(
      json.abi,
      json.bytecode,
      deployer
    ).deploy(...params, { nonce });
    await deployed.waitForDeployment();
    return await deployed.getAddress();
  }

  getStats(): RelayerStats {
    const orders = Array.from(this.orders.values());
    const totalVolume = orders.reduce((sum, order) => sum + order.order.makingAmount, 0n);
    
    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      completedOrders: orders.filter(o => o.status === 'funds_sent_to_wallet').length,
      failedOrders: orders.filter(o => o.status === 'cancelled').length,
      totalVolume
    };
  }

  getOrder(orderHash: string): CrossChainOrder | undefined {
    return this.orders.get(orderHash);
  }

  getAllOrders(): CrossChainOrder[] {
    return Array.from(this.orders.values());
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }

  // Helper methods for the fill test
  private async getSrcDeployEvent(blockHash: string): Promise<[Sdk.Immutables, Sdk.DstImmutablesComplement]> {
    return await this.srcFactory.getSrcDeployEvent(blockHash);
  }

  private async getSourceImpl(): Promise<Sdk.Address> {
    return await this.srcFactory.getSourceImpl();
  }

  private async increaseTime(seconds: number): Promise<void> {
    // This would need to be implemented for local blockchain forks
    // For now, just wait the specified time
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  private async getBalances(): Promise<any> {
    // Get actual token balances like in the test
    const srcToken = config.chain.source.tokens.USDC.address;
    const dstToken = config.chain.destination.tokens.USDC.address;
    
    // Create resolver contract wallets
    const srcResolverContract = await RelayerWallet.fromAddress(this.srcChain.resolver, this.srcChain.provider);
    const dstResolverContract = await RelayerWallet.fromAddress(this.dstChain.resolver, this.dstChain.provider);
    
    return {
      src: {
        user: await this.srcChain.wallet.tokenBalance(srcToken),
        resolver: await srcResolverContract.tokenBalance(srcToken)
      },
      dst: {
        user: await this.dstChain.wallet.tokenBalance(dstToken),
        resolver: await dstResolverContract.tokenBalance(dstToken)
      }
    };
  }

  // Aptos helper methods
  private async fundDstEscrowOnAptos(amount: bigint): Promise<string> {
    try {
      console.log(`Funding Aptos escrow with amount: ${amount}`);
      
      // Convert amount to number (assuming 6 decimals like USDC)
      const dstAmount = Number(amount) / 1000000; // Convert from 6 decimals to whole number
      const expirationDurationSecs = Math.floor(Date.now() / 1000) + 3600; // 1 hour
      
      // Create secret hash from the secret
      const secretBytes = ethers.toUtf8Bytes("my_secret_password_for_swap_test");
      const secretHash = ethers.keccak256(secretBytes);
      
      // Fund the destination escrow using the Aptos client
      const result = await this.aptosClient.fundDstEscrow(
        dstAmount,
        expirationDurationSecs,
        secretHash
      );
      
      console.log(`Aptos escrow funded: https://explorer.aptoslabs.com/txn/${result.hash}?network=mainnet`);
      return result.hash;
    } catch (error) {
      console.error("Error funding Aptos escrow:", error);
      throw error;
    }
  }

  private async claimFundsOnAptos(): Promise<string> {
    try {
      console.log("Claiming funds on Aptos...");
      
      // Create secret from the hardcoded secre
      const secret = "my_secret_password_for_swap_test";
      
      // Get current order ID from Aptos
      const orderId = (await this.aptosClient.getCurrentOrderId()) - 2;
      console.log(`Using order ID: ${orderId}`);
      const result = await this.aptosClient.claimFunds(orderId, secret);
      
      console.log(`Aptos funds claimed: https://explorer.aptoslabs.com/txn/${result.hash}?network=mainnet`);
      return result.hash;
    } catch (error) {
      console.error("Error claiming Aptos funds:", error);
      throw error;
    }
  }
} 