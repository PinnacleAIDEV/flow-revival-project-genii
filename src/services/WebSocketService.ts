
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
  open: number;
  high: number;
  low: number;
  close: number;
  kline_volume?: number;
}

export interface Alert {
  id: string;
  type: 'unusual_volume' | 'vwap_cross' | 'climactic_move' | 'liquidation' | 'large_order';
  ticker: string;
  timestamp: Date;
  details: any;
  alert_level: number;
  direction?: 'bullish' | 'bearish' | 'up' | 'down' | 'buy' | 'sell';
  price: number;
  amount?: number;
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
  private readonly WS_PORT = '8080';
  private readonly WSS_PORT = '8443'; // Porta segura
  
  // Tentar WSS primeiro (seguro), depois WS
  private getWebSocketUrl(): string {
    const isHttps = window.location.protocol === 'https:';
    if (isHttps) {
      return `wss://${this.DROPLET_IP}:${this.WSS_PORT}`;
    }
    return `ws://${this.DROPLET_IP}:${this.WS_PORT}`;
  }

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = this.getWebSocketUrl();
    console.log(`🔌 Connecting to Pinnacle AI Pro Flow at ${wsUrl}...`);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Connected to Pinnacle AI Pro Flow System');
          console.log(`🔗 Connected to droplet: ${this.DROPLET_IP}`);
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          
          // Enviar mensagem de handshake
          this.ws?.send(JSON.stringify({
            type: 'subscribe',
            channels: ['market_data', 'volume_alerts', 'flow_data'],
            client: 'pinnacle_ai_pro'
          }));
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📊 Received data from droplet:', data);
            
            // Processar diferentes tipos de dados
            if (data.type === 'market_data' || data.ticker || data.symbol) {
              const flowData: FlowData = {
                ticker: data.ticker || data.symbol || data.s,
                price: parseFloat(data.price || data.c || data.p),
                volume: parseFloat(data.volume || data.v || data.vol),
                timestamp: data.timestamp || data.E || Date.now(),
                exchange: data.exchange || data.ex || 'Unknown',
                bid: parseFloat(data.bid || data.b || data.price),
                ask: parseFloat(data.ask || data.a || data.price),
                change_24h: parseFloat(data.change_24h || data.P || '0'),
                volume_24h: parseFloat(data.volume_24h || data.q || data.volume),
                vwap: parseFloat(data.vwap || data.w || data.price),
                trades_count: parseInt(data.trades_count || data.n || '0'),
                open: parseFloat(data.open || data.o || data.price),
                high: parseFloat(data.high || data.h || data.price),
                low: parseFloat(data.low || data.l || data.price),
                close: parseFloat(data.close || data.c || data.price)
              };

              // Validar dados antes de enviar
              if (flowData.ticker && !isNaN(flowData.price)) {
                this.messageHandlers.forEach(handler => handler(flowData));
              }
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
            console.log('Raw message:', event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(new Error(`WebSocket connection failed to ${wsUrl}`));
        };

        this.ws.onclose = (event) => {
          console.log(`🔌 WebSocket connection closed: ${event.code} - ${event.reason}`);
          this.isConnecting = false;
          this.ws = null;
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`🔄 Attempting reconnection ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}...`);
            setTimeout(() => {
              this.reconnectAttempts++;
              this.connect().catch(console.error);
            }, this.reconnectInterval);
          } else {
            console.error(`❌ Max reconnection attempts reached for droplet ${this.DROPLET_IP}`);
          }
        };

        // Timeout para conexão
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            this.isConnecting = false;
            reject(new Error(`Connection timeout to ${wsUrl}`));
          }
        }, 15000); // Aumentado para 15 segundos

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

  // Método para testar conexão HTTP primeiro
  async testConnection(): Promise<boolean> {
    try {
      console.log(`🔍 Testing connection to droplet ${this.DROPLET_IP}...`);
      
      // Criar um AbortController para timeout manual
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://${this.DROPLET_IP}:3000/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ HTTP health check successful');
        return true;
      } else {
        console.warn(`⚠️ HTTP health check failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.warn(`⚠️ HTTP health check failed: ${error}`);
      return false;
    }
  }

  // Método para enviar ping/keepalive
  sendPing(): void {
    if (this.isConnected()) {
      this.ws?.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    }
  }
}

export const webSocketService = new WebSocketService();
