import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import winston from 'winston';
import { config } from './config';
import { CrossChainRelayer } from './relayer';
import { OrderRequest, OrderResponse, HealthResponse } from './types';

// Configure logging
const logger = winston.createLogger({
  level: config.server.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'fusion-plus-relayer' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export class RelayerServer {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer;
  private relayer: CrossChainRelayer;
  private startTime: number = Date.now();

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.relayer = new CrossChainRelayer();
    
    // Set up order update callback to broadcast via WebSocket
    this.relayer.setOrderUpdateCallback((orderHash, status, stages) => {
      this.broadcastToClients({
        type: 'order_status_updated',
        orderHash,
        status,
        stages,
        timestamp: new Date().toISOString()
      });
    });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    this.app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
      credentials: true
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const health: HealthResponse = {
        status: 'healthy',
        chains: {
          source: true, // TODO: Add actual health checks
          destination: true,
          aptos: true
        },
        uptime: this.relayer.getUptime(),
        version: '1.0.0'
      };
      res.json(health);
    });

    // Test endpoint
    this.app.post('/test', (req, res) => {
      logger.info('Test endpoint called with body:', req.body);
      res.json({ 
        success: true, 
        message: 'Test endpoint working',
        receivedBody: req.body 
      });
    });

    // Status endpoint
    this.app.get('/status', (req, res) => {
      const isInitialized = !!(this.relayer as any).srcChain && !!(this.relayer as any).dstChain;
      res.json({
        success: true,
        initialized: isInitialized,
        uptime: this.relayer.getUptime(),
        totalOrders: this.relayer.getAllOrders().length
      });
    });

    // Submit a new order
    this.app.post('/order', async (req, res) => {
      try {
        const orderRequest: any = req.body;
        logger.info('Received order request:', orderRequest);
        
        // Validate request
        if (!orderRequest.orderData || !orderRequest.userAddress) {
          logger.error('Missing required fields:', { 
            hasOrderData: !!orderRequest.orderData, 
            hasUserAddress: !!orderRequest.userAddress,
            body: req.body 
          });
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: orderData, userAddress'
          });
        }

        try {
          const orderHash = await this.relayer.processOrderFromData(orderRequest);
          
          const response: OrderResponse = {
            success: true,
            orderHash,
            message: 'Order submitted successfully'
          };

          // Broadcast to WebSocket clients
          this.broadcastToClients({
            type: 'order_submitted',
            orderHash,
            userAddress: orderRequest.userAddress,
            timestamp: new Date().toISOString()
          });

          res.json(response);
        } catch (error) {
          logger.error('Error processing order:', error);
          res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            orderHash: ''
          });
        }
      } catch (error) {
        logger.error('Error processing order:', error);
        const response: OrderResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          orderHash: ''
        };
        res.status(500).json(response);
      }
    });

    // Get order status
    this.app.get('/order/:orderHash', (req, res) => {
      try {
        const { orderHash } = req.params;
        const order = this.relayer.getOrder(orderHash);
        
        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
          orderHash: order.orderHash,
          status: order.status,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          srcEscrowAddress: order.srcEscrowAddress,
          dstEscrowAddress: order.dstEscrowAddress,
          stages: order.stages
        });
      } catch (error) {
        logger.error('Error getting order:', error);
        res.status(500).json({ error: 'Failed to get order' });
      }
    });

    // Get all orders
    this.app.get('/orders', (req, res) => {
      try {
        const orders = this.relayer.getAllOrders().map(order => ({
          orderHash: order.orderHash,
          status: order.status,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          makingAmount: order.order.makingAmount.toString(),
          takingAmount: order.order.takingAmount.toString()
        }));
        
        res.json(orders);
      } catch (error) {
        logger.error('Error getting orders:', error);
        res.status(500).json({ error: 'Failed to get orders' });
      }
    });

    // Cancel an order
    this.app.post('/order/:orderHash/cancel', async (req, res) => {
      try {
        const { orderHash } = req.params;
        const order = this.relayer.getOrder(orderHash);
        
        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status === 'funds_sent_to_wallet' || order.status === 'cancelled') {
          return res.status(400).json({ error: 'Order cannot be cancelled' });
        }

        // TODO: Implement order cancellation logic
        // For now, just mark as cancelled
        order.status = 'cancelled';
        order.updatedAt = new Date();

        this.broadcastToClients({
          type: 'order_cancelled',
          orderHash,
          timestamp: new Date().toISOString()
        });

        res.json({ success: true, message: 'Order cancelled successfully' });
      } catch (error) {
        logger.error('Error cancelling order:', error);
        res.status(500).json({ error: 'Failed to cancel order' });
      }
    });

    // Get balances for testing
    this.app.get('/balances', async (req, res) => {
      try {
        // This would need to be implemented based on the test structure
        res.json({
          message: 'Balance endpoint - implement based on test structure'
        });
      } catch (error) {
        logger.error('Error getting balances:', error);
        res.status(500).json({ error: 'Failed to get balances' });
      }
    });

    // Error handling middleware
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws) => {
      logger.info('New WebSocket client connected');
      
      // Send initial connection message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to Fusion Plus Relayer',
        timestamp: new Date().toISOString()
      }));

      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
    });
  }

  private broadcastToClients(message: any): void {
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message));
      }
    });
  }

  async start(): Promise<void> {
    try {
      // Initialize the relayer
      await this.relayer.initialize();
      
      // Start the server
      this.server.listen(config.server.port, () => {
        logger.info(`Fusion Plus Relayer Server running on port ${config.server.port}`);
        logger.info(`Health check: http://localhost:${config.server.port}/health`);
        logger.info(`WebSocket: ws://localhost:${config.server.port}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        logger.info('Server stopped');
        resolve();
      });
    });
  }
} 