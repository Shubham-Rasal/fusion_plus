import { RelayerClient } from './frontend-integration';
import Sdk from '@1inch/cross-chain-sdk';
import { ethers } from 'ethers';

// Test script to demonstrate relayer functionality
async function testRelayer() {
  console.log('🧪 Testing Fusion Plus Relayer...\n');

  // Initialize relayer client
  const relayer = new RelayerClient('http://localhost:3001');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health check...');
    const health = await relayer.getHealth();
    console.log('✅ Health check passed:', health);
    console.log('');

    // Test 3: Connect to WebSocket
    console.log('3️⃣ Connecting to WebSocket...');
    relayer.connectWebSocket();
    
    relayer.on('connected', (data: { message: any; }) => {
      console.log('✅ WebSocket connected:', data.message);
    });

    relayer.on('order_submitted', (data: { orderHash: any; }) => {
      console.log('✅ Order submitted event received:', data.orderHash);
    });

    // Wait for WebSocket connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('');

    // Test 4: Create and submit a test order
    console.log('4️⃣ Creating test cross-chain order...');
    
    // Create a sample order (this would normally come from the frontend)
    const testOrder = createTestOrder();
    const testSignature = '0x1234567890abcdef'; // Mock signature
    const testUserAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';

    console.log('📝 Test order created');
    console.log('📝 Mock signature:', testSignature);
    console.log('📝 User address:', testUserAddress);
    console.log('');

    // Submit the order
    console.log('5️⃣ Submitting test order...');
    const submitResult = await relayer.submitOrder(testOrder, testSignature, testUserAddress);
    console.log('✅ Order submitted successfully:', submitResult);
    console.log('');

    // Test 6: Get order status
    console.log('6️⃣ Getting order status...');
    const orderStatus = await relayer.getOrderStatus(submitResult.orderHash);
    console.log('✅ Order status:', orderStatus);
    console.log('');

    // Test 7: Get all orders
    console.log('7️⃣ Getting all orders...');
    const allOrders = await relayer.getAllOrders();
    console.log('✅ All orders:', allOrders);
    console.log('');

    // Test 8: Wait and check status again
    console.log('8️⃣ Waiting 5 seconds and checking status again...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const updatedStatus = await relayer.getOrderStatus(submitResult.orderHash);
    console.log('✅ Updated order status:', updatedStatus);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('');
    console.log('📊 Final Statistics:');
    const finalStats = await relayer.getStats();
    console.log(finalStats);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    relayer.disconnectWebSocket();
    console.log('\n🧹 Cleanup completed');
  }
}

// Helper function to create a test order
function createTestOrder() {
  // This is a simplified example - in reality, you'd use the SDK to create proper orders
  return {
    maker: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    makingAmount: '1000000', // 1 USDC (6 decimals)
    takingAmount: '1000000', // 1 USDC equivalent on destination
    makerAsset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    takerAsset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC (destination)
    salt: '123456789',
    allowPartialFills: false,
    allowMultipleFills: false,
    // Add other required fields based on the SDK
  };
}

// Example of how to create a proper order using the SDK
function createProperOrder() {
  const srcChainId = 1; // Ethereum mainnet
  const dstChainId = 2; // Destination chain
  
  const order = Sdk.CrossChainOrder.new(
    new Sdk.Address('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'), // escrowFactory
    {
      salt: Sdk.randBigInt(1000n),
      maker: new Sdk.Address('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'),
      makingAmount: ethers.parseUnits('1', 6), // 1 USDC
      takingAmount: ethers.parseUnits('1', 6), // 1 USDC equivalent
      makerAsset: new Sdk.Address('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
      takerAsset: new Sdk.Address('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
    },
    {
      hashLock: Sdk.HashLock.forSingleFill('test_secret_hash'),
      timeLocks: Sdk.TimeLocks.new({
        srcWithdrawal: 10n,
        srcPublicWithdrawal: 120n,
        srcCancellation: 121n,
        srcPublicCancellation: 122n,
        dstWithdrawal: 10n,
        dstPublicWithdrawal: 100n,
        dstCancellation: 101n,
      }),
      srcChainId: Sdk.NetworkEnum.ETHEREUM,
      dstChainId: Sdk.NetworkEnum.BINANCE, // Example destination
      srcSafetyDeposit: ethers.parseEther('0.001'),
      dstSafetyDeposit: ethers.parseEther('0.001'),
    },
    {
      auction: new Sdk.AuctionDetails({
        initialRateBump: 0,
        points: [],
        duration: 120n,
        startTime: BigInt(Math.floor(Date.now() / 1000)),
      }),
      whitelist: [
        {
          address: new Sdk.Address('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'),
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

  return order;
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRelayer().catch(console.error);
}

export { testRelayer, createTestOrder, createProperOrder }; 