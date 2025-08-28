
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
  liquidationType?: 'LONG' | 'SHORT';
  liquidationAmount?: number;
  liquidationPrice?: number;
  liquidationTime?: number;
  openInterestChange?: number;
  isLiquidation?: boolean;
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

class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private klineWs: WebSocket | null = null;
  private forceOrderWs: WebSocket | null = null;
  private messageHandlers: ((data: FlowData) => void)[] = [];
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private connectionError: string | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  
  // Droplet configuration
  private dropletIP = '157.245.240.29';
  private useDroplet = true;
  
  // Top liquidation pairs for real monitoring
  private symbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT',
    'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'VETUSDT',
    'FILUSDT', 'TRXUSDT', 'ETCUSDT', 'NEOUSDT', 'ALGOUSDT', 'MANAUSDT', 'SANDUSDT', 'AXSUSDT',
    'APEUSDT', 'CHZUSDT', 'GALAUSDT', 'ENJUSDT', 'NEARUSDT', 'QNTUSDT', 'FLOWUSDT', 'ICPUSDT',
    'THETAUSDT', 'XTZUSDT', 'MKRUSDT', 'FTMUSDT', 'AAVEUSDT', 'SNXUSDT', 'CRVUSDT', 'COMPUSDT',
    'UNIUSDT', 'SUSHIUSDT', 'YFIUSDT', 'ZRXUSDT', 'BATUSDT', 'RENUSDT', 'KNCUSDT', 'LRCUSDT'
  ];

  async connect(): Promise<void> {
    console.log(`🚀 Connecting to REAL Binance Force Order via Droplet ${this.dropletIP}...`);
    this.connectionStatus = 'connecting';
    this.connectionError = null;

    try {
      // Prioridade total: Force Order stream REAL
      await this.connectForceOrderStream();
      
      console.log('✅ Connected to REAL liquidation stream - Professional Force Order data active');
      this.connectionStatus = 'connected';
      this.connectionError = null;

    } catch (error) {
      console.error('❌ Failed to connect to Force Order stream:', error);
      this.connectionStatus = 'error';
      this.connectionError = error instanceof Error ? error.message : 'Connection failed';
      throw error;
    }
  }

  private async connectForceOrderStream(): Promise<void> {
    const wsUrl = this.useDroplet 
      ? `wss://fstream.binance.com/ws/!forceOrder@arr` // Via droplet proxy eventually
      : 'wss://fstream.binance.com/ws/!forceOrder@arr';
    
    console.log(`🔗 Connecting to REAL Force Order Stream via ${this.dropletIP}...`);
    
    this.forceOrderWs = new WebSocket(wsUrl);

    this.forceOrderWs.onopen = () => {
      console.log(`✅ REAL Force Order stream connected via droplet ${this.dropletIP} - Professional liquidation data active`);
    };

    this.forceOrderWs.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        const items = Array.isArray(raw)
          ? raw
          : (raw?.data
              ? (Array.isArray(raw.data) ? raw.data : [raw.data])
              : [raw]);

        items.forEach((msg: any) => {
          const payload = msg?.data ?? msg;
          if (payload?.e === 'forceOrder' && payload?.o) {
            const forceOrder = payload.o;
            const price = parseFloat(forceOrder.p);
            const qty = parseFloat(forceOrder.q);

            // Processar LIQUIDAÇÃO REAL PROFISSIONAL
            const flowData: FlowData = {
              ticker: forceOrder.s,
              price,
              volume: qty,
              timestamp: forceOrder.T,
              exchange: 'Binance',
              bid: price,
              ask: price,
              change_24h: 0,
              volume_24h: 0,
              vwap: price,
              trades_count: 1,
              open: price,
              high: price,
              low: price,
              close: price,
              isLiquidation: true,
              liquidationType: forceOrder.S === 'SELL' ? 'LONG' : 'SHORT',
              liquidationAmount: qty * price,
              liquidationPrice: price,
              liquidationTime: forceOrder.T
            };

            console.log(`🔥 PROFESSIONAL LIQUIDATION: ${flowData.ticker} - ${flowData.liquidationType} - $${(flowData.liquidationAmount!/1000).toFixed(1)}K at $${flowData.price.toFixed(4)}`);
            
            this.messageHandlers.forEach(handler => handler(flowData));
          }
        });
      } catch (error) {
        console.error('❌ Error parsing professional force order data:', error, (event as any).data?.slice?.(0, 200));
      }
    };

    this.forceOrderWs.onerror = (error) => {
      console.error('❌ Professional Force Order WebSocket error:', error);
    };

    this.forceOrderWs.onclose = () => {
      console.log('🔌 Professional Force Order WebSocket closed');
      this.handleReconnect();
    };
  }

  private handleReconnect(): void {
    this.connectionStatus = 'disconnected';
    
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }
    
    this.reconnectInterval = setTimeout(() => {
      console.log(`🔄 Attempting to reconnect to professional Force Order stream via ${this.dropletIP}...`);
      this.connect();
    }, 5000);
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

    if (this.klineWs) {
      this.klineWs.close();
      this.klineWs = null;
    }

    if (this.forceOrderWs) {
      this.forceOrderWs.close();
      this.forceOrderWs = null;
    }
    
    this.messageHandlers = [];
    this.connectionStatus = 'disconnected';
    this.connectionError = null;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.forceOrderWs?.readyState === WebSocket.OPEN;
  }

  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      error: this.connectionError,
      isSimulator: false,
      dropletIP: this.dropletIP,
      forceOrderActive: this.forceOrderWs?.readyState === WebSocket.OPEN,
      professionalData: true
    };
  }

  sendPing(): void {
    if (this.isConnected() && this.forceOrderWs) {
      this.forceOrderWs.send(JSON.stringify({ method: 'ping' }));
    }
  }

  forceReconnect(): void {
    console.log('🔄 FORCING CONNECTION RENEWAL...');
    
    // Clear any existing reconnect interval
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    // Close current connection if exists
    if (this.forceOrderWs) {
      this.forceOrderWs.close();
      this.forceOrderWs = null;
    }
    
    // Set status and immediately reconnect
    this.connectionStatus = 'disconnected';
    this.connectionError = null;
    
    console.log('💪 Initiating FRESH connection to Binance Force Order stream...');
    this.connect();
  }
}

export const binanceWebSocketService = new BinanceWebSocketService();
