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
  
  // Top 100 mais líquidos - otimizado para melhor detecção
  private symbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT',
    'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'VETUSDT',
    'FILUSDT', 'TRXUSDT', 'ETCUSDT', 'NEOUSDT', 'ALGOUSDT', 'MANAUSDT', 'SANDUSDT', 'AXSUSDT',
    'APEUSDT', 'CHZUSDT', 'GALAUSDT', 'ENJUSDT', 'NEARUSDT', 'QNTUSDT', 'FLOWUSDT', 'ICPUSDT',
    'THETAUSDT', 'XTZUSDT', 'MKRUSDT', 'FTMUSDT', 'AAVEUSDT', 'SNXUSDT', 'CRVUSDT', 'COMPUSDT',
    'UNIUSDT', 'SUSHIUSDT', 'YFIUSDT', 'ZRXUSDT', 'BATUSDT', 'RENUSDT', 'KNCUSDT', 'LRCUSDT',
    'ALPHAUSDT', 'ZENUSDT', 'ONEUSDT', 'ONTUSDT', 'ZILUSDT', 'RVNUSDT', 'CELRUSDT', 'CTKUSDT',
    'AKROUSDT', 'ANKRUSDT', 'AUDIOUSDT', 'AVAUSDT', 'BELUSDT', 'BLZUSDT', 'BNXUSDT', 'BTCSTUSDT',
    'CELOUSDT', 'CFXUSDT', 'CKBUSDT', 'COTIUSDT', 'CTSIUSDT', 'CVXUSDT', 'DARUSDT', 'DASHUSDT',
    'DATAUSDT', 'DCRUSTDT', 'DENTUSDT', 'DGBUSDT', 'DNTUSDT', 'DUSKUSDT', 'DYDXUSDT', 'EGLDUSDT',
    'ENSUSDT', 'EOSUSDT', 'FETUSDT', 'FIDAUSDT', 'FLMUSDT', 'FORTHUSDT', 'FTTUSDT', 'GALUSDT',
    'GMTUSDT', 'GRTUSDT', 'GTCUSDT', 'HBARUSDT', 'HNTUSDT', 'HOTUSDT', 'INOSUSDT', 'IOSTUSDT',
    'IOTAUSDT', 'JASMYUSDT', 'JOEUSDT', 'KAVAUSDT'
  ];

  async connect(): Promise<void> {
    console.log('🚀 Connecting to REAL Binance Force Order + Ticker Streams...');
    this.connectionStatus = 'connecting';
    this.connectionError = null;

    try {
      await Promise.all([
        this.connectTickerStream(),
        this.connectKlineStream(),
        this.connectForceOrderStream()
      ]);

      console.log('✅ Connected to REAL liquidation streams - Force Order detection active');
      this.connectionStatus = 'connected';
      this.connectionError = null;

    } catch (error) {
      console.error('❌ Failed to connect to Binance:', error);
      this.connectionStatus = 'error';
      this.connectionError = error instanceof Error ? error.message : 'Connection failed';
      throw error;
    }
  }

  private async connectForceOrderStream(): Promise<void> {
    const wsUrl = 'wss://fstream.binance.com/ws/!forceOrder@arr';
    
    console.log('🔗 Connecting to REAL Force Order Stream (Liquidations)...');
    
    this.forceOrderWs = new WebSocket(wsUrl);

    this.forceOrderWs.onopen = () => {
      console.log('✅ REAL Force Order stream connected - ACTUAL liquidation detection active');
    };

    this.forceOrderWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.e === 'forceOrder') {
          const forceOrder = data.o;
          
          // Processar LIQUIDAÇÃO REAL
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

          console.log(`🔥 REAL LIQUIDATION: ${flowData.ticker} - ${flowData.liquidationType} - $${(flowData.liquidationAmount!/1000).toFixed(1)}K at $${flowData.price.toFixed(4)}`);
          
          this.messageHandlers.forEach(handler => handler(flowData));
        }
      } catch (error) {
        console.error('❌ Error parsing force order data:', error);
      }
    };

    this.forceOrderWs.onerror = (error) => {
      console.error('❌ Force Order WebSocket error:', error);
    };

    this.forceOrderWs.onclose = () => {
      console.log('🔌 Force Order WebSocket closed');
      this.handleReconnect();
    };
  }

  private async connectTickerStream(): Promise<void> {
    const streamNames = this.symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamNames}`;
    
    console.log('🔗 Connecting to Enhanced Ticker Stream...');
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ Enhanced ticker stream connected - Price monitoring active');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.e === '24hrTicker') {
          const flowData: FlowData = {
            ticker: data.s,
            price: parseFloat(data.c),
            volume: parseFloat(data.v),
            timestamp: data.E,
            exchange: 'Binance',
            bid: parseFloat(data.b),
            ask: parseFloat(data.a),
            change_24h: parseFloat(data.P),
            volume_24h: parseFloat(data.q),
            vwap: parseFloat(data.w),
            trades_count: parseInt(data.n),
            open: parseFloat(data.o),
            high: parseFloat(data.h),
            low: parseFloat(data.l),
            close: parseFloat(data.c),
            isLiquidation: false
          };

          this.messageHandlers.forEach(handler => handler(flowData));
        }
      } catch (error) {
        console.error('❌ Error parsing ticker data:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ Ticker WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('🔌 Ticker WebSocket closed');
      this.handleReconnect();
    };
  }

  private async connectKlineStream(): Promise<void> {
    const topSymbols = this.symbols.slice(0, 50);
    const streamNames = topSymbols.map(symbol => `${symbol.toLowerCase()}@kline_1m`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamNames}`;
    
    console.log('🔗 Connecting to Enhanced Kline Stream (1min - Top 50 pairs)...');
    
    this.klineWs = new WebSocket(wsUrl);

    this.klineWs.onopen = () => {
      console.log('✅ Enhanced kline stream connected - Volume spike detection active');
    };

    this.klineWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.e === 'kline' && data.k.x) {
          const kline = data.k;
          const flowData: FlowData = {
            ticker: kline.s,
            price: parseFloat(kline.c),
            volume: parseFloat(kline.v),
            timestamp: kline.T,
            exchange: 'Binance',
            bid: parseFloat(kline.c),
            ask: parseFloat(kline.c),
            change_24h: ((parseFloat(kline.c) - parseFloat(kline.o)) / parseFloat(kline.o)) * 100,
            volume_24h: parseFloat(kline.q),
            vwap: parseFloat(kline.c),
            trades_count: parseInt(kline.n),
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            kline_volume: parseFloat(kline.v),
            isLiquidation: false
          };

          console.log(`📊 Kline Monitor: ${flowData.ticker} - Vol: ${flowData.kline_volume?.toFixed(0)} - Price: $${flowData.price.toFixed(4)}`);
          this.messageHandlers.forEach(handler => handler(flowData));
        }
      } catch (error) {
        console.error('❌ Error parsing kline data:', error);
      }
    };

    this.klineWs.onerror = (error) => {
      console.error('❌ Kline WebSocket error:', error);
    };

    this.klineWs.onclose = () => {
      console.log('🔌 Kline WebSocket closed');
      this.handleReconnect();
    };
  }

  private handleReconnect(): void {
    this.connectionStatus = 'disconnected';
    
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }
    
    this.reconnectInterval = setTimeout(() => {
      console.log('🔄 Attempting to reconnect to enhanced Binance streams...');
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
    return this.connectionStatus === 'connected';
  }

  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      error: this.connectionError,
      isSimulator: false,
      totalSymbols: this.symbols.length,
      klineSymbols: 50,
      forceOrderActive: this.forceOrderWs?.readyState === WebSocket.OPEN
    };
  }

  sendPing(): void {
    if (this.isConnected()) {
      if (this.ws) this.ws.send(JSON.stringify({ method: 'ping' }));
      if (this.klineWs) this.klineWs.send(JSON.stringify({ method: 'ping' }));
      if (this.forceOrderWs) this.forceOrderWs.send(JSON.stringify({ method: 'ping' }));
    }
  }
}

export const binanceWebSocketService = new BinanceWebSocketService();
