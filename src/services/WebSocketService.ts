
export interface FlowData {
  ticker: string;
  price: number;
  volume: number;
  timestamp: number;
  exchange: string;
  bid: number;
  ask: number;
  change_24h: number;
  volume_24h: number;
  vwap: number;
  trades_count: number;
}

export interface Alert {
  id: string;
  type: 'unusual_volume' | 'vwap_cross' | 'climactic_move';
  ticker: string;
  timestamp: Date;
  details: any;
  alert_level: number;
  direction?: 'bullish' | 'bearish' | 'up' | 'down';
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 5000;
  private messageHandlers: ((data: FlowData) => void)[] = [];
  private isConnecting = false;

  // Seu droplet da Digital Ocean
  private readonly DROPLET_IP = '157.245.240.29';
  private readonly WS_PORT = '8080'; // Ajuste se necessário
  private readonly WS_URL = `ws://${this.DROPLET_IP}:${this.WS_PORT}`;

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    console.log(`🔌 Connecting to Pinnacle AI Pro Flow at ${this.WS_URL}...`);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.WS_URL);

        this.ws.onopen = () => {
          console.log('✅ Connected to Pinnacle AI Pro Flow System');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          
          // Enviar mensagem de handshake se necessário
          this.ws?.send(JSON.stringify({
            type: 'subscribe',
            channels: ['market_data', 'volume_alerts', 'flow_data']
          }));
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📊 Received flow data:', data);
            
            // Processar dados baseado no tipo
            if (data.type === 'market_data' || data.ticker) {
              const flowData: FlowData = {
                ticker: data.ticker || data.symbol,
                price: parseFloat(data.price || data.c),
                volume: parseFloat(data.volume || data.v),
                timestamp: data.timestamp || Date.now(),
                exchange: data.exchange || 'Binance',
                bid: parseFloat(data.bid || data.b),
                ask: parseFloat(data.ask || data.a),
                change_24h: parseFloat(data.change_24h || data.P),
                volume_24h: parseFloat(data.volume_24h || data.q),
                vwap: parseFloat(data.vwap || data.w),
                trades_count: parseInt(data.trades_count || data.n)
              };

              this.messageHandlers.forEach(handler => handler(flowData));
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket connection closed:', event.code, event.reason);
          this.isConnecting = false;
          this.ws = null;
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`🔄 Attempting reconnection ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}...`);
            setTimeout(() => {
              this.reconnectAttempts++;
              this.connect().catch(console.error);
            }, this.reconnectInterval);
          } else {
            console.error('❌ Max reconnection attempts reached. Please check your droplet connection.');
          }
        };

        // Timeout para conexão
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  onMessage(handler: (data: FlowData) => void): void {
    this.messageHandlers.push(handler);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers = [];
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Método para testar conexão com fallback
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`http://${this.DROPLET_IP}:3000/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn('Health check failed, will try WebSocket directly');
      return false;
    }
  }
}

export const webSocketService = new WebSocketService();
