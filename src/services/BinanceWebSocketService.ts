
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
  direction?: 'bullish' | 'bearish' | 'up' | 'down';
  price: number;
  amount?: number;
}

class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private klineWs: WebSocket | null = null;
  private messageHandlers: ((data: FlowData) => void)[] = [];
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private connectionError: string | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  
  // Top 200 crypto symbols by market cap and volume
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
    'IOTAUSDT', 'JASMYUSDT', 'JOEUSDT', 'KAVAUSDT', 'KDAUSDT', 'KEYUSDT', 'KLAYUSDT', 'LAZIOUSDT',
    'LDOUSDT', 'LINAUSDT', 'LITUSDT', 'LPTUSDT', 'LUNAUSDT', 'MAGICUSDT', 'MASKUSDT', 'MINAUSDT',
    'MOVRUSDT', 'MTLUSDT', 'NKNUSDT', 'NMRUSDT', 'OCEANUSDT', 'OGNUSDT', 'OMGUSDT', 'OPUSDT',
    'ORCAUSDT', 'ORNUSDT', 'PENDLEUSDT', 'PEOPLEUSDT', 'PERPUSDT', 'POLYXUSDT', 'POWRUSDT', 'PUNDIXUSDT',
    'RAREUSDT', 'RAYUSDT', 'RDNTUSDT', 'REEFUSDT', 'REQUSDT', 'RIFUSDT', 'ROSEUSDT', 'RSRUSDT',
    'RUNEUSDT', 'SCUSDT', 'SFPUSDT', 'SKLUSDT', 'SLPUSDT', 'SPELLUSDT', 'SRMUSDT', 'STGUSDT',
    'STMXUSDT', 'STORJUSDT', 'STXUSDT', 'SUNUSDT', 'SXPUSDT', 'TLMUSDT', 'TOMOUSDT', 'TRBUSDT',
    'TRUUSDT', 'TVKUSDT', 'TWOUSDT', 'UNFIUSDT', 'VICUSDT', 'VOXELUSDT', 'WAXPUSDT', 'WINUSDT',
    'WOOUSDT', 'XEMUSDT', 'XVSUSDT', 'YGGUSDT', 'ZECUSDT', 'ZENUSDT', 'ZRXUSDT', 'ACHUSDT',
    'AIDOGEUSDT', 'ARBUSDT', 'ASTRUSDT', 'BICOUSDT', 'BLURUSDT', 'BONKUSDT', 'COMBOUSDT', 'COREUSDT',
    'EDUUSDT', 'FLOKIUSDT', 'GASUSDT', 'HIGHUSDT', 'HOOKUSDT', 'IDUSDT', 'IMXUSDT', 'INJUSDT',
    'JSTUSDT', 'LEVERUSDT', 'LQTYUSDT', 'MAVUSDT', 'MDTUSDT', 'PEPEUSDT', 'PHBUSDT', 'RADUSDT',
    'RDNTUSDT', 'RNDRUSDT', 'SEIUSDT', 'STXUSDT', 'SUIUSDT', 'SXPUSDT', 'TIAUSDT', 'TRUUSDT',
    'USDCUSDT', 'WLDUSDT', 'XAIUSDT', 'XVGUSDT', 'XVSUSDT', 'ZKUSDT', 'ARKMUSDT', 'BEAMXUSDT'
  ];

  async connect(): Promise<void> {
    console.log('🚀 Connecting to Binance WebSocket Stream (200 assets)...');
    this.connectionStatus = 'connecting';
    this.connectionError = null;

    try {
      await Promise.all([
        this.connectTickerStream(),
        this.connectKlineStream()
      ]);

      console.log('✅ Connected to both Ticker and Kline streams');
      this.connectionStatus = 'connected';
      this.connectionError = null;

    } catch (error) {
      console.error('❌ Failed to connect to Binance:', error);
      this.connectionStatus = 'error';
      this.connectionError = error instanceof Error ? error.message : 'Connection failed';
      throw error;
    }
  }

  private async connectTickerStream(): Promise<void> {
    const streamNames = this.symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamNames}`;
    
    console.log('🔗 Connecting to Ticker Stream...');
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ Ticker stream connected');
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
            close: parseFloat(data.c)
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
    // Dividir em múltiplas conexões para evitar limite de URL
    const chunkSize = 50;
    const chunks = [];
    
    for (let i = 0; i < this.symbols.length; i += chunkSize) {
      chunks.push(this.symbols.slice(i, i + chunkSize));
    }

    // Conectar apenas o primeiro chunk por agora (50 símbolos)
    const firstChunk = chunks[0];
    const streamNames = firstChunk.map(symbol => `${symbol.toLowerCase()}@kline_1m`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamNames}`;
    
    console.log('🔗 Connecting to Kline Stream (1min)...');
    
    this.klineWs = new WebSocket(wsUrl);

    this.klineWs.onopen = () => {
      console.log('✅ Kline stream connected (1min timeframe)');
    };

    this.klineWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.e === 'kline' && data.k.x) { // Kline fechado
          const kline = data.k;
          const flowData: FlowData = {
            ticker: kline.s,
            price: parseFloat(kline.c),
            volume: parseFloat(kline.v),
            timestamp: kline.T,
            exchange: 'Binance',
            bid: parseFloat(kline.c),
            ask: parseFloat(kline.c),
            change_24h: 0,
            volume_24h: parseFloat(kline.q),
            vwap: parseFloat(kline.c),
            trades_count: parseInt(kline.n),
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            kline_volume: parseFloat(kline.v)
          };

          console.log(`📊 Kline 1min: ${flowData.ticker} - $${flowData.price.toFixed(4)} Vol: ${flowData.kline_volume?.toFixed(0)}`);
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
      console.log('🔄 Attempting to reconnect to Binance...');
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
      totalSymbols: this.symbols.length
    };
  }

  sendPing(): void {
    if (this.isConnected()) {
      if (this.ws) this.ws.send(JSON.stringify({ method: 'ping' }));
      if (this.klineWs) this.klineWs.send(JSON.stringify({ method: 'ping' }));
    }
  }
}

export const binanceWebSocketService = new BinanceWebSocketService();
