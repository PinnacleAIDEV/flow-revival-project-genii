import { supabase } from '@/integrations/supabase/client';

export interface MultiTimeframeAlert {
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

interface VolumeBaseline {
  [symbol: string]: {
    [timeframe: string]: {
      average: number;
      samples: number;
      lastUpdate: number;
    };
  };
}

class MultiTimeframeVolumeService {
  private spotWs: WebSocket | null = null;
  private futuresWs: WebSocket | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private volumeBaselines: VolumeBaseline = {};
  private alertHandlers: ((alert: MultiTimeframeAlert) => void)[] = [];
  
  // Timeframes que vamos monitorar
  private timeframes = ['1m', '3m', '15m'] as const;
  
  // Símbolos principais para análise
  private spotSymbols = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT',
    'AVAXUSDT', 'MATICUSDT', 'ATOMUSDT', 'NEARUSDT', 'ALGOUSDT', 'VETUSDT',
    'XLMUSDT', 'FILUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT', 'GRTUSDT',
    'ENJUSDT', 'CHZUSDT', 'BATUSDT', 'ZECUSDT', 'DASHUSDT', 'COMPUSDT',
    'YFIUSDT', 'SUSHIUSDT', 'SNXUSDT', 'MKRUSDT', 'AAVEUSDT', 'UNIUSDT'
  ];

  private futuresSymbols = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT',
    'AVAXUSDT', 'MATICUSDT', 'ATOMUSDT', 'NEARUSDT', 'ALGOUSDT', 'VETUSDT',
    'XLMUSDT', 'FILUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT', 'GRTUSDT',
    'ENJUSDT', 'CHZUSDT', 'BATUSDT', 'ZECUSDT', 'DASHUSDT', 'COMPUSDT',
    'YFIUSDT', 'SUSHIUSDT', 'SNXUSDT', 'MKRUSDT', 'AAVEUSDT', 'UNIUSDT',
    'DOGEUSDT', 'SHIBUSDT', 'PEPEUSDT', 'FLOKIUSDT', 'WIFUSDT', 'BONKUSDT'
  ];

  async connect(): Promise<void> {
    if (this.isConnecting) return;
    
    this.isConnecting = true;
    console.log('🚀 MULTI-TIMEFRAME SERVICE: Starting connections...');

    try {
      await Promise.all([
        this.connectSpotKlines(),
        this.connectFuturesKlines()
      ]);
      
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      console.log('✅ MULTI-TIMEFRAME SERVICE: All connections established');
    } catch (error) {
      this.isConnecting = false;
      console.error('❌ MULTI-TIMEFRAME SERVICE: Connection failed:', error);
      throw error;
    }
  }

  private async connectSpotKlines(): Promise<void> {
    // Criar streams para todos os timeframes de spot
    const allStreams: string[] = [];
    for (const timeframe of this.timeframes) {
      const streams = this.spotSymbols.map(symbol => `${symbol.toLowerCase()}@kline_${timeframe}`);
      allStreams.push(...streams);
    }
    
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${allStreams.join('/')}`;
    console.log(`🔗 SPOT MULTI-TF: Connecting ${allStreams.length} streams (${this.timeframes.length} timeframes)`);
    
    this.spotWs = new WebSocket(wsUrl);
    
    this.spotWs.onopen = () => {
      console.log('✅ SPOT MULTI-TF: WebSocket connected');
    };

    this.spotWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.stream && data.data && data.data.e === 'kline') {
          this.processKlineData(data.data, 'spot');
        }
      } catch (error) {
        console.error('❌ SPOT MULTI-TF: Message processing error:', error);
      }
    };

    this.spotWs.onerror = (error) => {
      console.error('❌ SPOT MULTI-TF: WebSocket error:', error);
    };

    this.spotWs.onclose = () => {
      console.log('🔌 SPOT MULTI-TF: WebSocket disconnected');
      this.handleReconnect();
    };
  }

  private async connectFuturesKlines(): Promise<void> {
    // Criar streams para todos os timeframes de futures
    const allStreams: string[] = [];
    for (const timeframe of this.timeframes) {
      const streams = this.futuresSymbols.map(symbol => `${symbol.toLowerCase()}@kline_${timeframe}`);
      allStreams.push(...streams);
    }
    
    const wsUrl = `wss://fstream.binance.com/stream?streams=${allStreams.join('/')}`;
    console.log(`🔗 FUTURES MULTI-TF: Connecting ${allStreams.length} streams (${this.timeframes.length} timeframes)`);
    
    this.futuresWs = new WebSocket(wsUrl);
    
    this.futuresWs.onopen = () => {
      console.log('✅ FUTURES MULTI-TF: WebSocket connected');
    };

    this.futuresWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.stream && data.data && data.data.e === 'kline') {
          this.processKlineData(data.data, 'futures');
        }
      } catch (error) {
        console.error('❌ FUTURES MULTI-TF: Message processing error:', error);
      }
    };

    this.futuresWs.onerror = (error) => {
      console.error('❌ FUTURES MULTI-TF: WebSocket error:', error);
    };

    this.futuresWs.onclose = () => {
      console.log('🔌 FUTURES MULTI-TF: WebSocket disconnected');
      this.handleReconnect();
    };
  }

  private processKlineData(kline: KlineData, marketType: 'spot' | 'futures'): void {
    // Só processar klines fechados
    if (!kline.x) return;

    const symbol = kline.s;
    const timeframe = kline.i;
    const volume = parseFloat(kline.v);
    const quoteVolume = parseFloat(kline.q);
    const trades = kline.n;
    const openPrice = parseFloat(kline.o);
    const closePrice = parseFloat(kline.c);
    const priceMovement = ((closePrice - openPrice) / openPrice) * 100;

    // Atualizar baseline de volume
    this.updateVolumeBaseline(symbol, timeframe, volume);

    // Detectar anomalia de volume
    const alert = this.detectVolumeAnomaly(
      symbol,
      timeframe as '1m' | '3m' | '15m',
      marketType,
      volume,
      quoteVolume,
      priceMovement,
      closePrice,
      trades
    );

    if (alert) {
      console.log(`🚨 MULTI-TF ALERT: ${marketType.toUpperCase()} - ${symbol} - ${timeframe} - ${alert.volumeMultiplier.toFixed(2)}x | ${alert.priceMovement.toFixed(2)}% | ⭐${alert.strength}`);
      
      // Notificar handlers
      this.alertHandlers.forEach(handler => handler(alert));
      
      // Salvar no Supabase
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
      console.log(`🆕 NEW BASELINE: ${symbol} ${timeframe} | Inicial: ${volume.toFixed(2)}`);
    } else {
      const baseline = this.volumeBaselines[symbol][timeframe];
      const alpha = 0.1; // Weight for exponential moving average
      const oldAverage = baseline.average;
      baseline.average = baseline.average * (1 - alpha) + volume * alpha;
      baseline.samples = Math.min(baseline.samples + 1, 100); // Max 100 samples
      baseline.lastUpdate = Date.now();
      
      // Log apenas a cada 50 updates para não flood
      if (baseline.samples % 50 === 0) {
        console.log(`📈 BASELINE UPDATE: ${symbol} ${timeframe} | Old: ${oldAverage.toFixed(2)} | New: ${baseline.average.toFixed(2)} | Samples: ${baseline.samples}`);
      }
    }
  }

  private detectVolumeAnomaly(
    symbol: string,
    timeframe: '1m' | '3m' | '15m',
    marketType: 'spot' | 'futures',
    volume: number,
    quoteVolume: number,
    priceMovement: number,
    price: number,
    trades: number
  ): MultiTimeframeAlert | null {
    const baseline = this.volumeBaselines[symbol]?.[timeframe];
    if (!baseline || baseline.samples < 3) {
      console.log(`⚠️ SKIP ALERT: ${symbol} ${timeframe} - Baseline insuficiente: ${baseline?.samples || 0} amostras`);
      return null; // Reduzido para 3 amostras para testar
    }

    const volumeMultiplier = volume / baseline.average;
    
    // Debug detalhado
    console.log(`📊 VOLUME CHECK: ${symbol} ${timeframe} | Vol: ${volume} | Baseline: ${baseline.average.toFixed(2)} | Mult: ${volumeMultiplier.toFixed(2)}x | Samples: ${baseline.samples}`);
    
    // Threshold temporariamente reduzido para 1.5x para teste
    if (volumeMultiplier < 1.5) {
      console.log(`⚠️ SKIP ALERT: ${symbol} ${timeframe} - Volume muito baixo: ${volumeMultiplier.toFixed(2)}x < 1.5x`);
      return null;
    }

    // Determinar tipo de alerta baseado no market type e price movement
    let alertType: 'buy' | 'sell' | 'long' | 'short';
    if (marketType === 'spot') {
      alertType = priceMovement > 0 ? 'buy' : 'sell';
    } else {
      alertType = priceMovement > 0 ? 'long' : 'short';
    }

    // Calcular strength (1-5) baseado em múltiplos fatores
    let strength = 1;
    if (volumeMultiplier >= 10) strength = 5;
    else if (volumeMultiplier >= 7) strength = 4;
    else if (volumeMultiplier >= 5) strength = 3;
    else if (volumeMultiplier >= 3) strength = 2;

    // Bonus por movimento de preço significativo
    if (Math.abs(priceMovement) > 5) strength = Math.min(5, strength + 1);
    
    // Bonus por alto número de trades
    if (trades > 1000) strength = Math.min(5, strength + 1);

    // Determinar região da sessão baseada no horário UTC
    const sessionRegion = this.getSessionRegion();

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
      sessionRegion,
      tradesCount: trades,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    };
  }

  private getSessionRegion(): string {
    const now = new Date();
    const utcHour = now.getUTCHours();
    
    // Sessões de trading
    if (utcHour >= 0 && utcHour < 8) return 'asia';
    if (utcHour >= 8 && utcHour < 16) return 'europe';
    return 'america';
  }

  private async saveAlertToDatabase(alert: MultiTimeframeAlert): Promise<void> {
    try {
      const { error } = await supabase.rpc('save_unusual_volume_alert', {
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
        console.error('❌ Failed to save alert to database:', error);
      }
    } catch (error) {
      console.error('❌ Database save error:', error);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ MULTI-TF: Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 MULTI-TF: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('❌ MULTI-TF: Reconnection failed:', error);
      });
    }, delay);
  }

  onAlert(handler: (alert: MultiTimeframeAlert) => void): void {
    this.alertHandlers.push(handler);
  }

  disconnect(): void {
    console.log('🔌 MULTI-TF: Disconnecting...');
    
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
      timeframes: this.timeframes,
      spotSymbols: this.spotSymbols.length,
      futuresSymbols: this.futuresSymbols.length,
      totalStreams: (this.spotSymbols.length + this.futuresSymbols.length) * this.timeframes.length,
      reconnectAttempts: this.reconnectAttempts,
      isConnecting: this.isConnecting
    };
  }
}

export const multiTimeframeVolumeService = new MultiTimeframeVolumeService();