import { supabase } from '@/integrations/supabase/client';

export interface UnusualVolumeAlert {
  id: string;
  ticker: string;
  asset: string;
  timeframe: '1m' | '3m' | '15m';
  marketType: 'spot' | 'futures';
  alertType: 'buy' | 'sell' | 'long' | 'short';
  volumeBaseline: number;
  volumeCurrent: number;
  volumeMultiplier: number;
  priceMovement: number;
  price: number;
  strength: 1 | 2 | 3 | 4 | 5;
  sessionRegion: string;
  tradesCount: number;
  timestamp: Date;
  expiresAt: Date;
}

interface KlineData {
  s: string; // Symbol
  t: number; // Open time
  T: number; // Close time
  i: string; // Interval
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  c: string; // Close price
  v: string; // Volume
  n: number; // Number of trades
  x: boolean; // Is this kline closed?
  q: string; // Quote asset volume
}

interface KlineCandle {
  openTime: number;
  closeTime: number;
  openPrice: number;
  closePrice: number;
  volume: number;
  trades: number;
  isClosed: boolean;
}

interface VolumeBaseline {
  [symbol: string]: {
    [timeframe: string]: {
      average: number;
      samples: number;
      lastUpdate: number;
    };
  };
}

class UnusualVolumeV2Service {
  private spotWs: WebSocket | null = null;
  private futuresWs: WebSocket | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private volumeBaselines: VolumeBaseline = {};
  private alertHandlers: ((alert: UnusualVolumeAlert) => void)[] = [];
  
  // In-memory kline storage for 3m and 15m aggregation
  private klineHistory: {
    [symbol: string]: {
      [market: string]: KlineCandle[];
    };
  } = {};
  
  // Core symbols for focused analysis (reduced from 30+ to 20)
  private coreSymbols = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT', 
    'LINKUSDT', 'AVAXUSDT', 'MATICUSDT', 'ATOMUSDT', 'NEARUSDT',
    'ALGOUSDT', 'VETUSDT', 'XLMUSDT', 'FILUSDT', 'SANDUSDT',
    'MANAUSDT', 'AXSUSDT', 'GRTUSDT', 'ENJUSDT', 'CHZUSDT'
  ];

  async connect(): Promise<void> {
    if (this.isConnecting) return;
    this.isConnecting = true;
    
    console.log('🚀 UNUSUAL VOLUME V2: Starting optimized connections...');

    try {
      await Promise.all([
        this.connectSpot1mKlines(),
        this.connectFutures1mKlines()
      ]);
      
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      console.log('✅ UNUSUAL VOLUME V2: All connections established');
    } catch (error) {
      this.isConnecting = false;
      console.error('❌ UNUSUAL VOLUME V2: Connection failed:', error);
      throw error;
    }
  }

  private async connectSpot1mKlines(): Promise<void> {
    // Connect only to 1m klines for core symbols
    const streams = this.coreSymbols.map(symbol => `${symbol.toLowerCase()}@kline_1m`);
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`;
    
    console.log(`🔗 SPOT V2: Connecting ${streams.length} 1m streams`);
    this.spotWs = new WebSocket(wsUrl);
    
    this.spotWs.onopen = () => {
      console.log('✅ SPOT V2: WebSocket connected');
    };

    this.spotWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.stream && data.data && data.data.e === 'kline' && data.data.x) {
          // Only process CLOSED klines
          this.processKlineData(data.data, 'spot');
        }
      } catch (error) {
        console.error('❌ SPOT V2: Message processing error:', error);
      }
    };

    this.spotWs.onerror = (error) => {
      console.error('❌ SPOT V2: WebSocket error:', error);
    };

    this.spotWs.onclose = () => {
      console.log('🔌 SPOT V2: WebSocket disconnected');
      this.handleReconnect();
    };
  }

  private async connectFutures1mKlines(): Promise<void> {
    // Connect only to 1m klines for core symbols
    const streams = this.coreSymbols.map(symbol => `${symbol.toLowerCase()}@kline_1m`);
    const wsUrl = `wss://fstream.binance.com/stream?streams=${streams.join('/')}`;
    
    console.log(`🔗 FUTURES V2: Connecting ${streams.length} 1m streams`);
    this.futuresWs = new WebSocket(wsUrl);
    
    this.futuresWs.onopen = () => {
      console.log('✅ FUTURES V2: WebSocket connected');
    };

    this.futuresWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.stream && data.data && data.data.e === 'kline' && data.data.x) {
          // Only process CLOSED klines
          this.processKlineData(data.data, 'futures');
        }
      } catch (error) {
        console.error('❌ FUTURES V2: Message processing error:', error);
      }
    };

    this.futuresWs.onerror = (error) => {
      console.error('❌ FUTURES V2: WebSocket error:', error);
    };

    this.futuresWs.onclose = () => {
      console.log('🔌 FUTURES V2: WebSocket disconnected');
      this.handleReconnect();
    };
  }

  private processKlineData(kline: KlineData, marketType: 'spot' | 'futures'): void {
    // Safety checks to prevent NaN
    const volume = this.safeParseFloat(kline.v);
    const openPrice = this.safeParseFloat(kline.o);
    const closePrice = this.safeParseFloat(kline.c);
    const trades = kline.n || 0;

    if (volume <= 0 || openPrice <= 0 || closePrice <= 0) {
      console.warn(`⚠️ Invalid kline data for ${kline.s}: volume=${volume}, open=${openPrice}, close=${closePrice}`);
      return;
    }

    const symbol = kline.s;
    const priceMovement = ((closePrice - openPrice) / openPrice) * 100;

    console.log(`📊 KLINE V2: ${marketType} ${symbol} | Vol: ${this.formatVolume(volume)} | Price: ${priceMovement.toFixed(2)}% | Trades: ${trades}`);

    // Store 1m kline data for aggregation
    this.storeKlineData(symbol, marketType, {
      openTime: kline.t,
      closeTime: kline.T,
      openPrice,
      closePrice,
      volume,
      trades,
      isClosed: kline.x
    });

    // Process 1m alert
    this.detectAndCreateAlert(symbol, '1m', marketType, volume, priceMovement, closePrice, trades);

    // Aggregate and process 3m alerts
    const candles3m = this.aggregate3mCandles(symbol, marketType);
    if (candles3m && candles3m.length > 0) {
      const latest3m = candles3m[candles3m.length - 1];
      const volume3m = candles3m.reduce((sum, c) => sum + c.volume, 0);
      const trades3m = candles3m.reduce((sum, c) => sum + c.trades, 0);
      const priceMovement3m = ((latest3m.closePrice - candles3m[0].openPrice) / candles3m[0].openPrice) * 100;

      this.detectAndCreateAlert(symbol, '3m', marketType, volume3m, priceMovement3m, latest3m.closePrice, trades3m);
    }

    // Aggregate and process 15m alerts
    const candles15m = this.aggregate15mCandles(symbol, marketType);
    if (candles15m && candles15m.length > 0) {
      const latest15m = candles15m[candles15m.length - 1];
      const volume15m = candles15m.reduce((sum, c) => sum + c.volume, 0);
      const trades15m = candles15m.reduce((sum, c) => sum + c.trades, 0);
      const priceMovement15m = ((latest15m.closePrice - candles15m[0].openPrice) / candles15m[0].openPrice) * 100;

      this.detectAndCreateAlert(symbol, '15m', marketType, volume15m, priceMovement15m, latest15m.closePrice, trades15m);
    }
  }

  private safeParseFloat(value: string): number {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  private storeKlineData(symbol: string, marketType: string, candle: KlineCandle): void {
    if (!this.klineHistory[symbol]) {
      this.klineHistory[symbol] = {};
    }
    if (!this.klineHistory[symbol][marketType]) {
      this.klineHistory[symbol][marketType] = [];
    }

    const history = this.klineHistory[symbol][marketType];
    history.push(candle);

    // Keep only last 15 minutes of data (15 candles)
    if (history.length > 15) {
      history.splice(0, history.length - 15);
    }
  }

  private aggregate3mCandles(symbol: string, marketType: string): KlineCandle[] | null {
    const history = this.klineHistory[symbol]?.[marketType];
    if (!history || history.length < 3) return null;

    // Get last 3 candles for 3m aggregation
    return history.slice(-3);
  }

  private aggregate15mCandles(symbol: string, marketType: string): KlineCandle[] | null {
    const history = this.klineHistory[symbol]?.[marketType];
    if (!history || history.length < 15) return null;

    // Get last 15 candles for 15m aggregation
    return history.slice(-15);
  }

  private detectAndCreateAlert(
    symbol: string,
    timeframe: '1m' | '3m' | '15m',
    marketType: 'spot' | 'futures',
    volume: number,
    priceMovement: number,
    price: number,
    trades: number
  ): void {
    // Update baseline
    this.updateVolumeBaseline(symbol, timeframe, volume);

    // Detect anomaly
    const alert = this.detectVolumeAnomaly(
      symbol,
      timeframe,
      marketType,
      volume,
      priceMovement,
      price,
      trades
    );

    if (alert) {
      console.log(`🚨 V2 ALERT: ${marketType.toUpperCase()} ${symbol} ${timeframe} | ${alert.volumeMultiplier.toFixed(2)}x | ${alert.priceMovement > 0 ? '+' : ''}${alert.priceMovement.toFixed(2)}% | ⭐${alert.strength}`);
      
      // Notify handlers
      this.alertHandlers.forEach(handler => handler(alert));
      
      // Save to database
      this.saveAlertToDatabase(alert);
    }
  }

  private updateVolumeBaseline(symbol: string, timeframe: string, volume: number): void {
    if (!this.volumeBaselines[symbol]) {
      this.volumeBaselines[symbol] = {};
    }
    
    if (!this.volumeBaselines[symbol][timeframe]) {
      this.volumeBaselines[symbol][timeframe] = {
        average: volume,
        samples: 1,
        lastUpdate: Date.now()
      };
    } else {
      const baseline = this.volumeBaselines[symbol][timeframe];
      const alpha = 0.05; // Slower adaptation for more stable baseline
      baseline.average = baseline.average * (1 - alpha) + volume * alpha;
      baseline.samples = Math.min(baseline.samples + 1, 50); // Max 50 samples
      baseline.lastUpdate = Date.now();
    }
  }

  private detectVolumeAnomaly(
    symbol: string,
    timeframe: '1m' | '3m' | '15m',
    marketType: 'spot' | 'futures',
    volume: number,
    priceMovement: number,
    price: number,
    trades: number
  ): UnusualVolumeAlert | null {
    const baseline = this.volumeBaselines[symbol]?.[timeframe];
    if (!baseline || baseline.samples < 3) {
      return null; // Need at least 3 samples for reliable baseline
    }

    const volumeMultiplier = volume / baseline.average;
    
    // Realistic threshold - at least 2.5x for noise reduction
    const threshold = 2.5;
    if (volumeMultiplier < threshold) {
      return null;
    }

    // Determine alert type
    let alertType: 'buy' | 'sell' | 'long' | 'short';
    if (marketType === 'spot') {
      alertType = priceMovement > 0 ? 'buy' : 'sell';
    } else {
      alertType = priceMovement > 0 ? 'long' : 'short';
    }

    // Calculate strength (1-5) with realistic criteria
    let strength = 1;
    if (volumeMultiplier >= 10) strength = 5;
    else if (volumeMultiplier >= 7) strength = 4;
    else if (volumeMultiplier >= 5) strength = 3;
    else if (volumeMultiplier >= 3.5) strength = 2;

    // Bonus for significant price movement (>2%)
    if (Math.abs(priceMovement) > 2) strength = Math.min(5, strength + 1);
    
    // Bonus for high trade count
    if (trades > 1000) strength = Math.min(5, strength + 1);

    const asset = symbol.replace('USDT', '');

    return {
      id: crypto.randomUUID(),
      ticker: symbol,
      asset,
      timeframe,
      marketType,
      alertType,
      volumeBaseline: baseline.average,
      volumeCurrent: volume,
      volumeMultiplier,
      priceMovement,
      price,
      strength: strength as 1 | 2 | 3 | 4 | 5,
      sessionRegion: this.getSessionRegion(),
      tradesCount: trades,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  private getSessionRegion(): string {
    const now = new Date();
    const utcHour = now.getUTCHours();
    
    if (utcHour >= 0 && utcHour < 8) return 'asia';
    if (utcHour >= 8 && utcHour < 16) return 'europe';
    return 'america';
  }

  private async saveAlertToDatabase(alert: UnusualVolumeAlert): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('save_unusual_volume_alert', {
        p_ticker: alert.ticker,
        p_asset: alert.asset,
        p_timeframe: alert.timeframe,
        p_market_type: alert.marketType,
        p_alert_type: alert.alertType,
        p_volume_baseline: alert.volumeBaseline,
        p_volume_current: alert.volumeCurrent,
        p_volume_multiplier: alert.volumeMultiplier,
        p_price_movement: alert.priceMovement,
        p_price: alert.price,
        p_strength: alert.strength,
        p_session_region: alert.sessionRegion,
        p_trades_count: alert.tradesCount
      });

      if (error) {
        console.error('❌ V2 DATABASE SAVE ERROR:', error);
      } else {
        console.log(`✅ V2 ALERT SAVED: ${alert.ticker} | ${alert.timeframe} | ${alert.volumeMultiplier.toFixed(2)}x`);
      }
    } catch (error) {
      console.error('❌ V2 EXCEPTION DURING DB SAVE:', error);
    }
  }

  private formatVolume(volume: number): string {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(2);
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ V2: Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 V2: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('❌ V2: Reconnection failed:', error);
      });
    }, delay);
  }

  onAlert(handler: (alert: UnusualVolumeAlert) => void): void {
    this.alertHandlers.push(handler);
  }

  disconnect(): void {
    console.log('🔌 V2: Disconnecting...');
    
    if (this.spotWs) {
      this.spotWs.close();
      this.spotWs = null;
    }
    
    if (this.futuresWs) {
      this.futuresWs.close();
      this.futuresWs = null;
    }
    
    this.alertHandlers = [];
    this.volumeBaselines = {};
    this.klineHistory = {};
  }

  isConnected(): boolean {
    const spotConnected = this.spotWs?.readyState === WebSocket.OPEN;
    const futuresConnected = this.futuresWs?.readyState === WebSocket.OPEN;
    return spotConnected && futuresConnected;
  }

  getConnectionStatus(): any {
    const spotConnected = this.spotWs?.readyState === WebSocket.OPEN;
    const futuresConnected = this.futuresWs?.readyState === WebSocket.OPEN;
    const isFullyConnected = spotConnected && futuresConnected;
    
    return {
      status: isFullyConnected ? 'connected' : 'connecting',
      spotStatus: spotConnected ? 'connected' : 'connecting',
      futuresStatus: futuresConnected ? 'connected' : 'connecting',
      version: 'V2',
      symbols: this.coreSymbols.length,
      totalStreams: this.coreSymbols.length * 2, // spot + futures
      reconnectAttempts: this.reconnectAttempts,
      isConnecting: this.isConnecting
    };
  }

  getConnectionInfo(): any {
    return this.getConnectionStatus();
  }
}

export const unusualVolumeV2Service = new UnusualVolumeV2Service();
