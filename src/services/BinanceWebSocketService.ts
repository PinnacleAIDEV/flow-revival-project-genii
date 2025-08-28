
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
  private isConnecting: boolean = false;
  
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
    // Prevent multiple simultaneous connections
    if (this.isConnecting || this.isConnected()) {
      console.log('⚠️ Connection already in progress or established');
      return;
    }

    this.isConnecting = true;
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
    } finally {
      this.isConnecting = false;
    }
  }

  private async connectForceOrderStream(): Promise<void> {
    // Try multiple endpoints for better reliability
    const endpoints = [
      'wss://fstream.binance.com/ws/!forceOrder@arr',
      'wss://dstream.binance.com/ws/!forceOrder@arr', 
      'wss://fstream.binance.com/stream?streams=!forceOrder@arr'
    ];
    
    let connected = false;
    let lastError: any = null;
    
    for (const wsUrl of endpoints) {
      if (connected) break;
      
      console.log(`🔗 Trying endpoint: ${wsUrl}`);
      
      try {
        await this.tryConnect(wsUrl);
        connected = true;
        console.log(`✅ Successfully connected to: ${wsUrl}`);
        break;
      } catch (error) {
        console.log(`❌ Failed endpoint: ${wsUrl}`, error);
        lastError = error;
        continue;
      }
    }
    
    if (!connected) {
      throw new Error(`All endpoints failed. Last error: ${lastError}`);
    }
  }

  private async tryConnect(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      let resolved = false;
      
      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ws.close();
          reject(new Error('Connection timeout'));
        }
      }, 10000);

      ws.onopen = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          this.forceOrderWs = ws;
          this.setupEventHandlers(wsUrl);
          resolve();
        }
      };

      ws.onerror = (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(error);
        }
      };
    });
  }

  private setupEventHandlers(wsUrl: string): void {
    if (!this.forceOrderWs) return;

    this.forceOrderWs.onopen = () => {
      console.log(`✅ REAL Force Order stream connected`);
      console.log(`🔍 WebSocket readyState: ${this.forceOrderWs?.readyState}`);
      console.log(`🌐 Connected to URL: ${wsUrl}`);
      console.log(`⏰ Waiting for Force Order data...`);
    };

    this.forceOrderWs.onmessage = (event) => {
      console.log('📨 RAW WebSocket message received:', event.data);
      
      try {
        const rawData = JSON.parse(event.data);
        console.log('📋 Parsed WebSocket data:', JSON.stringify(rawData, null, 2));
        
        // Handle both array format and single object format
        const dataArray = Array.isArray(rawData) ? rawData : [rawData];
        console.log(`📊 Processing ${dataArray.length} data items`);
        
        dataArray.forEach((data, index) => {
          console.log(`📄 Item ${index}:`, JSON.stringify(data, null, 2));
          
          if (data.e === 'forceOrder') {
            const forceOrder = data.o;
            console.log('💥 Force Order detected:', JSON.stringify(forceOrder, null, 2));
            
            // Processar LIQUIDAÇÃO REAL PROFISSIONAL
            const flowData: FlowData = {
              ticker: forceOrder.s,
              price: parseFloat(forceOrder.p),
              volume: parseFloat(forceOrder.q),
              timestamp: forceOrder.T,
              exchange: 'Binance',
              bid: parseFloat(forceOrder.p),
              ask: parseFloat(forceOrder.p),
              change_24h: 0,
              volume_24h: 0,
              vwap: parseFloat(forceOrder.p),
              trades_count: 1,
              open: parseFloat(forceOrder.p),
              high: parseFloat(forceOrder.p),
              low: parseFloat(forceOrder.p),
              close: parseFloat(forceOrder.p),
              isLiquidation: true,
              liquidationType: forceOrder.S === 'SELL' ? 'LONG' : 'SHORT',
              liquidationAmount: parseFloat(forceOrder.q) * parseFloat(forceOrder.p),
              liquidationPrice: parseFloat(forceOrder.p),
              liquidationTime: forceOrder.T
            };

            console.log(`🔥 PROFESSIONAL LIQUIDATION: ${flowData.ticker} - ${flowData.liquidationType} - $${(flowData.liquidationAmount!/1000).toFixed(1)}K at $${flowData.price.toFixed(4)}`);
            
            this.messageHandlers.forEach(handler => handler(flowData));
          } else {
            console.log(`❓ Unknown event type: ${data.e || 'no event type'}`);
          }
        });
      } catch (error) {
        console.error('❌ Error parsing professional force order data:', error);
        console.log('📝 Raw data that caused error:', event.data);
      }
    };

    this.forceOrderWs.onerror = (error) => {
      console.error('❌ Professional Force Order WebSocket error:', error);
      console.log('🔍 Error details:', {
        readyState: this.forceOrderWs?.readyState,
        url: wsUrl,
        timestamp: new Date().toISOString()
      });
    };

    this.forceOrderWs.onclose = (event) => {
      console.log('🔌 Professional Force Order WebSocket closed');
      console.log('🔍 Close details:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        timestamp: new Date().toISOString()
      });
      this.handleReconnect();
    };

    // Add a heartbeat to test if connection is alive
    setTimeout(() => {
      if (this.forceOrderWs?.readyState === WebSocket.OPEN) {
        console.log('💓 WebSocket heartbeat - Connection is alive but no data received yet');
        console.log('🔍 This might mean low liquidation activity right now');
        console.log('⚠️ If no data in 30 seconds, there might be an issue with the stream');
      }
    }, 10000);
  }

  private handleReconnect(): void {
    this.connectionStatus = 'disconnected';
    this.isConnecting = false;
    
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
    this.isConnecting = false;
    
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
}

export const binanceWebSocketService = new BinanceWebSocketService();
