// Relayer client for browser environment
export class BrowserRelayerClient {
  private baseUrl: string;
  private ws: WebSocket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  // REST API Methods
  async getHealth(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }

  async submitOrder(orderRequest: any, signature: string, userAddress: string): Promise<any> {
    console.log('Submitting order request:', orderRequest);
    
    const response = await fetch(`${this.baseUrl}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderRequest)
    });
    
    const result = await response.json();
    console.log('Order submission result:', result);
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit order');
    }
    
    return result;
  }

  async getOrderStatus(orderHash: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/order/${orderHash}`);
    return response.json();
  }

  // WebSocket Methods
  connectWebSocket(): void {
    const wsUrl = this.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to relayer WebSocket');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketEvent(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from relayer WebSocket');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        this.connectWebSocket();
      }, 5000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Event Handling
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private handleWebSocketEvent(data: any): void {
    const { type } = data;
    const listeners = this.eventListeners.get(type);
    
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${type}:`, error);
        }
      });
    }
  }
} 