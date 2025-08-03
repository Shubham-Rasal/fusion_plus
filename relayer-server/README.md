# Fusion Plus Cross-Chain Relayer Server

A cross-chain relayer server that handles transactions between Ethereum and Aptos chains using the Fusion Plus protocol.

## Features

- **Cross-Chain Transactions**: Handles swaps between Ethereum and Aptos
- **Real-time Updates**: WebSocket support for real-time order status updates
- **REST API**: Comprehensive API for order management
- **Event Monitoring**: Monitors blockchain events and executes transactions
- **Health Monitoring**: Built-in health checks and statistics
- **Logging**: Comprehensive logging with Winston

## Architecture

The relayer server consists of several key components:

1. **CrossChainRelayer**: Core relayer logic that processes orders
2. **RelayerServer**: Express server with REST API and WebSocket support
3. **Wallet Management**: Handles wallet operations for both Ethereum and Aptos
4. **Contract Integration**: Interfaces with EscrowFactory and Resolver contracts

## Installation

1. Clone the repository and navigate to the relayer server directory:
```bash
cd fusion_plus/relayer-server
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file and configure it:
```bash
cp env.example .env
```

4. Edit `.env` with your configuration:
```env
# Chain Configuration
SRC_CHAIN_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
DST_CHAIN_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
SRC_CHAIN_CREATE_FORK=true
DST_CHAIN_CREATE_FORK=true

# Relayer Configuration
RELAYER_PRIVATE_KEY=your_ethereum_private_key
APTOS_PRIVATE_KEY=your_aptos_private_key
APTOS_ADDRESS=your_aptos_address

# Server Configuration
SERVER_PORT=3001
LOG_LEVEL=info
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```http
GET /health
```

### Statistics
```http
GET /stats
```

### Submit Order
```http
POST /order
Content-Type: application/json

{
  "order": {
    // Cross-chain order object
  },
  "signature": "0x...",
  "userAddress": "0x..."
}
```

### Get Order Status
```http
GET /order/:orderHash
```

### Get All Orders
```http
GET /orders
```

### Cancel Order
```http
POST /order/:orderHash/cancel
```

## WebSocket Events

The server broadcasts the following events via WebSocket:

- `connected`: When a client connects
- `order_submitted`: When a new order is submitted
- `order_cancelled`: When an order is cancelled
- `order_completed`: When an order is completed

## Cross-Chain Transaction Flow

1. **Order Submission**: User submits a cross-chain order with signature
2. **Source Escrow Deployment**: Relayer deploys escrow on source chain
3. **Destination Funding**: Relayer funds escrow on destination chain (Aptos)
4. **Time Lock Wait**: System waits for time locks to expire
5. **Fund Claiming**: User claims funds on destination chain
6. **Resolver Withdrawal**: Relayer withdraws funds from source chain

## Configuration

### Chain Configuration
- `SRC_CHAIN_RPC`: Source chain RPC URL
- `DST_CHAIN_RPC`: Destination chain RPC URL
- `SRC_CHAIN_CREATE_FORK`: Whether to create a fork for source chain
- `DST_CHAIN_CREATE_FORK`: Whether to create a fork for destination chain

### Relayer Configuration
- `RELAYER_PRIVATE_KEY`: Ethereum private key for relayer
- `APTOS_PRIVATE_KEY`: Aptos private key for relayer
- `APTOS_ADDRESS`: Aptos address for relayer

### Server Configuration
- `SERVER_PORT`: Port for the server to listen on
- `LOG_LEVEL`: Logging level (error, warn, info, debug)

## Development

### Project Structure
```
src/
├── config.ts          # Configuration management
├── types.ts           # TypeScript type definitions
├── wallet.ts          # Wallet utilities
├── resolver.ts        # Resolver contract interface
├── aptos-client.ts    # Aptos client utilities
├── relayer.ts         # Core relayer logic
├── server.ts          # Express server with API
└── index.ts           # Main entry point
```

### Testing
```bash
npm test
```

### Building
```bash
npm run build
```

## Security Considerations

- Store private keys securely
- Use environment variables for sensitive data
- Implement proper authentication for production
- Monitor transactions and implement rate limiting
- Regular security audits of smart contracts

## Monitoring

The server provides several monitoring endpoints:

- `/health`: Health check for all chains
- `/stats`: Relayer statistics and metrics
- Log files: `error.log` and `combined.log`

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check RPC URLs and network connectivity
2. **Gas Issues**: Ensure relayer wallet has sufficient gas
3. **Contract Deployment**: Verify contract addresses and ABI
4. **Time Lock Issues**: Check time lock configurations

### Logs

Check the log files for detailed error information:
- `error.log`: Error-level logs
- `combined.log`: All logs
- Console: Real-time logs during development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details 