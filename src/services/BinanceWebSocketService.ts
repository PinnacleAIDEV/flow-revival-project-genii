
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

class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: ((data: FlowData) => void)[] = [];
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private connectionError: string | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private symbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'DOTUSDT',
    'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT', 'XRPUSDT', 'DOGEUSDT',
    'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'VETUSDT', 'FILUSDT', 'TRXUSDT',
    'ETCUSDT', 'NEOUSDT'
  ];

  async connect(): Promise<void> {
    console.log('🚀 Connecting to Binance WebSocket Stream...');
    this.connectionStatus = 'connecting';
    this.connectionError = null;

    try {
      // Binance WebSocket URL para ticker 24hr
      const streamNames = this.symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/');
      const wsUrl = `wss://stream.binance.com:9443/ws/${streamNames}`;
      
      console.log(`🔗 Connecting to: ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Connected to Binance WebSocket');
        this.connectionStatus = 'connected';
        this.connectionError = null;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Processar dados do ticker 24hr da Binance
          if (data.e === '24hrTicker') {
            const flowData: FlowData = {
              ticker: data.s, // symbol
              price: parseFloat(data.c), // current price
              volume: parseFloat(data.v), // volume
              timestamp: data.E, // event time
              exchange: 'Binance',
              bid: parseFloat(data.b), // best bid price
              ask: parseFloat(data.a), // best ask price
              change_24h: parseFloat(data.P), // price change percent
              volume_24h: parseFloat(data.q), // quote asset volume
              vwap: parseFloat(data.w), // weighted average price
              trades_count: parseInt(data.n) // total number of trades
            };

            console.log(`📊 Real data: ${flowData.ticker} - $${flowData.price.toFixed(4)}`);
            
            // Enviar para handlers
            this.messageHandlers.forEach(handler => handler(flowData));
          }
        } catch (error) {
          console.error('❌ Error parsing Binance data:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Binance WebSocket error:', error);
        this.connectionStatus = 'error';
        this.connectionError = 'Failed to connect to Binance WebSocket';
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 Binance WebSocket closed: ${event.code} - ${event.reason}`);
        this.connectionStatus = 'disconnected';
        this.ws = null;
        
        // Auto-reconnect after 5 seconds
        this.reconnectInterval = setTimeout(() => {
          console.log('🔄 Attempting to reconnect to Binance...');
          this.connect();
        }, 5000);
      };

    } catch (error) {
      console.error('❌ Failed to connect to Binance:', error);
      this.connectionStatus = 'error';
      this.connectionError = error instanceof Error ? error.message : 'Connection failed';
      throw error;
    }
  }

  onMessage(handler: (data: FlowData) => void): void {
    this.messageHandlers.push(handler);
  }

  disconnect(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.messageHandlers = [];
    this.connectionStatus = 'disconnected';
    this.connectionError = null;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      error: this.connectionError,
      isSimulator: false // Sempre dados reais
    };
  }

  sendPing(): void {
    if (this.isConnected() && this.ws) {
      this.ws.send(JSON.stringify({ method: 'ping' }));
    }
  }
}

export const binanceWebSocketService = new BinanceWebSocketService();
