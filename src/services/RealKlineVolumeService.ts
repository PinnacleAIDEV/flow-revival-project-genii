export interface KlineData {
  ticker: string;
  interval: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  volumeUSD: number;
  trades: number;
  timestamp: number;
  vwap: number;
  change24h: number;
  volumeSpike: number;
  avgVolume: number;
  isUnusual: boolean;
  marketType: 'spot' | 'futures';
  strength: number;
  priceMovement: number;
}

export interface VolumeAlert {
  id: string;
  ticker: string;
  asset: string;
  type: 'spot_buy' | 'spot_sell' | 'futures_long' | 'futures_short';
  volume: number;
  volumeSpike: number;
  price: number;
  priceMovement: number;
  change24h: number;
  timestamp: Date;
  strength: number;
  avgVolume: number;
  marketType: 'spot' | 'futures';
  trades: number;
  interval: string;
}

class RealKlineVolumeService {
  private spotWs: WebSocket | null = null;
  private futuresWs: WebSocket | null = null;
  private messageHandlers: ((alert: VolumeAlert) => void)[] = [];
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private volumeHistory: Map<string, number[]> = new Map();
  
  // FUTURES PRIORITY - ALTCOIN SEASON (150+ ATIVOS)
  private futuresSymbols = [
    // MAJOR CAPS
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT', 'ATOMUSDT',
    
    // MEMECOINS FUTURES (ALTCOIN SEASON FOCUS)
    'DOGEUSDT', 'SHIBUSDT', 'PEPEUSDT', 'WIFUSDT', 'BONKUSDT', 'FLOKIUSDT', 'MEMEUSDT', 'BRETTUSDT', 'POPUSDT',
    
    // AI/TECH FUTURES (HOT SECTOR)
    'FETUSDT', 'AGIXUSDT', 'OCEANUSDT', 'RENDERUSDT', 'THETAUSDT', 'ARKMUSDT', 'PHBUSDT', 'AIUSDT', 'TAUSDT',
    
    // GAMING/NFT FUTURES
    'AXSUSDT', 'SANDUSDT', 'MANAUSDT', 'ENJUSDT', 'GALAUSDT', 'CHZUSDT', 'FLOWUSDT', 'ILVUSDT', 'GMTUSDT',
    
    // LAYER 1s FUTURES
    'NEARUSDT', 'SUIUSDT', 'APTUSDT', 'SEIUSDT', 'INJUSDT', 'KASUSDT', 'TIAAUSDT', 'STRKUSDT',
    
    // DEFI FUTURES
    'UNIUSDT', 'AAVEUSDT', 'CRVUSDT', 'SUSHIUSDT', '1INCHUSDT', 'COMPUSDT', 'MKRUSDT', 'SNXUSDT', 'RUNEUSDT',
    
    // INFRASTRUCTURE
    'FILUSDT', 'ARUSDT', 'STORJUSDT', 'ICPUSDT', 'GRTUSDT', 'RNDRUSDT', 'ORDIUSDT', 'STXUSDT',
    
    // ALTCOIN SEASON FAVORITES
    'JUPUSDT', 'PYUSDT', 'WLDUSDT', 'MANTAUSDT', 'APEUSDT', 'LDOUSDT', 'JTOOSDT', 'ALTUSDT',
    
    // NEW LISTINGS & TRENDING
    'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'VETUSDT', 'TRXUSDT', 'QNTUSDT', 'XTZUSDT', 'ALGOUSDT'
  ];

  // SPOT PRIORITY ASSETS
  private spotSymbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT',
    'PEPEUSDT', 'SHIBUSDT', 'WIFUSDT', 'BONKUSDT', 'FLOKIUSDT', 'FETUSDT', 'NEARUSDT', 'SUIUSDT',
    'APTUSDT', 'INJUSDT', 'TIAAUSDT', 'MANTAUSDT', 'JUPUSDT', 'WLDUSDT', 'RENDERUSDT', 'TAUSDT'
  ];

  async connect(): Promise<void> {
    console.log('🚀 REAL KLINE VOLUME SERVICE - Connecting to Binance streams...');
    this.connectionStatus = 'connecting';

    try {
      // Conectar streams simultaneamente
      await Promise.all([
        this.connectSpotKlines(),
        this.connectFuturesKlines()
      ]);
      
      this.connectionStatus = 'connected';
      console.log('✅ REAL KLINE VOLUME - All streams connected and monitoring volume anomalies');
    } catch (error) {
      console.error('❌ Failed to connect kline volume streams:', error);
      this.connectionStatus = 'error';
      throw error;
    }
  }

  private async connectSpotKlines(): Promise<void> {
    // Criar streams para múltiplos símbolos spot - klines 1m
    const streams = this.spotSymbols.map(symbol => `${symbol.toLowerCase()}@kline_1m`);
    const wsUrl = `wss://stream.binance.com:9443/ws/${streams.join('/')}`;
    
    console.log(`🔗 SPOT KLINES: Connecting to ${this.spotSymbols.length} symbols`);
    
    this.spotWs = new WebSocket(wsUrl);

    this.spotWs.onopen = () => {
      console.log(`✅ SPOT KLINES connected - ${this.spotSymbols.length} symbols monitoring`);
    };

    this.spotWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.stream && data.data && data.data.e === 'kline') {
          this.processKlineData(data.data, 'spot');
        }
      } catch (error) {
        console.error('❌ Error processing spot kline:', error);
      }
    };

    this.spotWs.onerror = (error) => {
      console.error('❌ Spot klines WebSocket error:', error);
    };

    this.spotWs.onclose = () => {
      console.log('🔌 Spot klines WebSocket closed');
      this.handleReconnect();
    };
  }

  private async connectFuturesKlines(): Promise<void> {
    // Crear streams para múltiplos símbolos futures - klines 1m
    const streams = this.futuresSymbols.map(symbol => `${symbol.toLowerCase()}@kline_1m`);
    const wsUrl = `wss://fstream.binance.com/ws/${streams.join('/')}`;
    
    console.log(`🔗 FUTURES KLINES: Connecting to ${this.futuresSymbols.length} symbols`);
    
    this.futuresWs = new WebSocket(wsUrl);

    this.futuresWs.onopen = () => {
      console.log(`✅ FUTURES KLINES connected - ${this.futuresSymbols.length} symbols monitoring`);
    };

    this.futuresWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.stream && data.data && data.data.e === 'kline') {
          this.processKlineData(data.data, 'futures');
        }
      } catch (error) {
        console.error('❌ Error processing futures kline:', error);
      }
    };

    this.futuresWs.onerror = (error) => {
      console.error('❌ Futures klines WebSocket error:', error);
    };

    this.futuresWs.onclose = () => {
      console.log('🔌 Futures klines WebSocket closed');
      this.handleReconnect();
    };
  }

  private processKlineData(kline: any, marketType: 'spot' | 'futures'): void {
    const k = kline.k;
    const ticker = k.s;
    const volume = parseFloat(k.v);
    const close = parseFloat(k.c);
    const open = parseFloat(k.o);
    const trades = parseInt(k.n);
    
    // Calcular dados básicos
    const priceMovement = ((close - open) / open) * 100;
    const volumeUSD = volume * close;
    
    // SMART VOLUME: Combinar volume USD + trades weight
    const smartVolume = volumeUSD + (trades * 100);
    
    // Detectar anomalia de volume
    const alert = this.detectVolumeAnomaly(
      ticker,
      smartVolume,
      close,
      priceMovement,
      marketType,
      trades,
      k.T // timestamp
    );

    if (alert) {
      console.log(`🚨 VOLUME ANOMALY: ${marketType.toUpperCase()} - ${ticker} - ${alert.volumeSpike.toFixed(2)}x | ${alert.priceMovement.toFixed(2)}% | ⭐${alert.strength}`);
      this.messageHandlers.forEach(handler => handler(alert));
    }
  }

  private detectVolumeAnomaly(
    ticker: string,
    volume: number,
    price: number,
    priceChange: number,
    marketType: 'spot' | 'futures',
    tradesCount: number,
    timestamp: number
  ): VolumeAlert | null {
    // Volume history management
    const volumeKey = `${ticker}_${marketType}`;
    const history = this.volumeHistory.get(volumeKey) || [];
    
    history.push(volume);
    
    // Manter apenas últimos 10 valores para maior sensibilidade
    if (history.length > 10) {
      history.shift();
    }
    this.volumeHistory.set(volumeKey, history);

    // Precisa de pelo menos 2 pontos para comparar
    if (history.length < 2) return null;

    const avgVolume = history.reduce((sum, v) => sum + v, 0) / history.length;
    const volumeSpike = volume / (avgVolume || 1);

    // THRESHOLD ULTRA-AGRESSIVO: 1.05x base (dinâmico)
    let threshold = 1.05;
    
    // Threshold dinâmico baseado na volatilidade
    if (Math.abs(priceChange) > 5) threshold = 1.03; // Mais agressivo para high volatility
    if (Math.abs(priceChange) > 10) threshold = 1.01; // Extremamente agressivo para pumps
    if (marketType === 'futures') threshold *= 0.95; // 5% mais agressivo para futures

    if (volumeSpike < threshold) {
      return null;
    }

    // Determinar tipo de alerta
    let alertType: VolumeAlert['type'];
    if (marketType === 'futures') {
      alertType = priceChange >= 0 ? 'futures_long' : 'futures_short';
    } else {
      alertType = priceChange >= 0 ? 'spot_buy' : 'spot_sell';
    }

    // SISTEMA DE FORÇA OTIMIZADO
    let strength = 1;
    
    // Base strength por volume spike
    if (volumeSpike >= 3) strength = 5;
    else if (volumeSpike >= 2) strength = 4;
    else if (volumeSpike >= 1.5) strength = 3;
    else if (volumeSpike >= 1.2) strength = 2;
    else if (volumeSpike >= threshold) strength = 2;
    
    // Bonus por price movement
    if (Math.abs(priceChange) >= 5) strength = Math.min(5, strength + 2);
    else if (Math.abs(priceChange) >= 3) strength = Math.min(5, strength + 1);
    else if (Math.abs(priceChange) >= 1) strength = Math.min(5, strength + 1);
    
    // Bonus por trades count
    if (tradesCount > 200) strength = Math.min(5, strength + 1);
    else if (tradesCount > 100) strength = Math.min(5, strength + 1);
    
    // Bonus futures priority
    if (marketType === 'futures') {
      strength = Math.min(5, strength + 1);
    }

    return {
      id: `${ticker}-${marketType}-${timestamp}-${Math.random()}`,
      ticker,
      asset: ticker.replace('USDT', ''),
      type: alertType,
      volume,
      volumeSpike,
      price,
      priceMovement: priceChange,
      change24h: priceChange,
      timestamp: new Date(timestamp),
      strength,
      avgVolume,
      marketType,
      trades: tradesCount,
      interval: '1m'
    };
  }

  private handleReconnect(): void {
    this.connectionStatus = 'disconnected';
    
    setTimeout(() => {
      console.log('🔄 Reconnecting REAL kline volume streams...');
      this.connect();
    }, 5000);
  }

  onVolumeAlert(handler: (alert: VolumeAlert) => void): void {
    this.messageHandlers.push(handler);
  }

  disconnect(): void {
    if (this.spotWs) {
      this.spotWs.close();
      this.spotWs = null;
    }

    if (this.futuresWs) {
      this.futuresWs.close();
      this.futuresWs = null;
    }
    
    this.messageHandlers = [];
    this.connectionStatus = 'disconnected';
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected' && 
           this.spotWs?.readyState === WebSocket.OPEN && 
           this.futuresWs?.readyState === WebSocket.OPEN;
  }

  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      spotConnected: this.spotWs?.readyState === WebSocket.OPEN,
      futuresConnected: this.futuresWs?.readyState === WebSocket.OPEN,
      spotSymbols: this.spotSymbols.length,
      futuresSymbols: this.futuresSymbols.length,
      totalSymbols: this.spotSymbols.length + this.futuresSymbols.length
    };
  }
}

export const realKlineVolumeService = new RealKlineVolumeService();