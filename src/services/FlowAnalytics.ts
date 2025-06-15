import { FlowData, Alert } from './BinanceWebSocketService';

export class FlowAnalytics {
  private volumeHistory: Map<string, number[]> = new Map();
  private priceHistory: Map<string, number[]> = new Map();
  private vwapTracker: Map<string, { position: string; vwap: number }> = new Map();
  private klineHistory: Map<string, Array<{
    volume: number;
    timestamp: number;
    price: number;
    high: number;
    low: number;
    close: number;
    open: number;
  }>> = new Map();

  analyzeFlowData(data: FlowData): Alert[] {
    const alerts: Alert[] = [];

    // Detectar liquidações (baseado em quedas/subidas bruscas com volume alto)
    const liquidationAlert = this.detectLiquidations(data);
    if (liquidationAlert) alerts.push(liquidationAlert);

    // Detectar volume anormal melhorado
    const volumeAlert = this.detectUnusualVolume(data);
    if (volumeAlert) alerts.push(volumeAlert);

    // Detectar ordens grandes
    const largeOrderAlert = this.detectLargeOrders(data);
    if (largeOrderAlert) alerts.push(largeOrderAlert);

    // Detectar padrões de kline anormais
    if (data.kline_volume) {
      const klineAlert = this.detectAbnormalKline(data);
      if (klineAlert) alerts.push(klineAlert);
    }

    // Atualizar histórico
    this.updateHistory(data);

    return alerts;
  }

  private detectLiquidations(data: FlowData): Alert | null {
    const { ticker, price, volume, change_24h } = data;
    const history = this.volumeHistory.get(ticker) || [];
    
    if (history.length < 10) return null;

    const avgVolume = history.reduce((sum, v) => sum + v, 0) / history.length;
    const volumeSpike = volume / avgVolume;

    // Liquidação: Volume muito alto (5x+) + movimento brusco de preço (3%+)
    if (volumeSpike > 5.0 && Math.abs(change_24h) > 3.0) {
      return {
        id: `liquidation-${Date.now()}`,
        type: 'liquidation',
        ticker,
        timestamp: new Date(),
        details: {
          direction: change_24h > 0 ? 'long_squeeze' : 'short_squeeze',
          priceMove: `${change_24h.toFixed(2)}%`,
          volumeSpike: `${volumeSpike.toFixed(1)}X`,
          estimated_amount: (volume * price).toFixed(0)
        },
        alert_level: 5, // Sempre crítico
        direction: change_24h > 0 ? 'bullish' : 'bearish',
        price: price
      };
    }

    return null;
  }

  private detectAbnormalKline(data: FlowData): Alert | null {
    const { ticker, kline_volume, price, high, low, open, close } = data;
    
    if (!kline_volume) return null;

    const history = this.klineHistory.get(ticker) || [];
    
    const newKline = {
      volume: kline_volume,
      timestamp: data.timestamp,
      price,
      high,
      low,
      close,
      open
    };

    history.push(newKline);
    if (history.length > 60) history.shift(); // Manter 1 hora
    this.klineHistory.set(ticker, history);

    if (history.length < 20) return null;

    // Calcular média de volume das últimas 20 klines
    const recentKlines = history.slice(-20, -1); // Excluir a atual
    const avgVolume = recentKlines.reduce((sum, k) => sum + k.volume, 0) / recentKlines.length;
    const volumeIncrease = (kline_volume / avgVolume) * 100;

    // Detectar volume anormal em kline (350%+ da média)
    if (volumeIncrease >= 350 && avgVolume > 0) {
      const priceMovement = ((close - open) / open) * 100;
      
      // Determinar direção do sinal
      const alertType = this.determineKlineDirection(newKline, priceMovement, data.change_24h);
      
      return {
        id: `kline-${ticker}-${data.timestamp}`,
        type: 'unusual_volume',
        ticker,
        timestamp: new Date(data.timestamp),
        details: {
          direction: alertType,
          volume: kline_volume.toFixed(0),
          volumeIncrease: `${(volumeIncrease - 100).toFixed(0)}%`,
          priceMove: `${priceMovement.toFixed(2)}%`,
          timeframe: '1min'
        },
        alert_level: this.calculateKlineAlertLevel(volumeIncrease, Math.abs(priceMovement)),
        direction: alertType,
        price: price
      };
    }

    return null;
  }

  private determineKlineDirection(kline: any, priceMovement: number, change24h: number): 'buy' | 'sell' {
    const { open, close, high, low } = kline;
    
    // Análise de wick para determinar pressão
    const upperWick = high - Math.max(open, close);
    const lowerWick = Math.min(open, close) - low;
    const bodySize = Math.abs(close - open);
    
    let buySignals = 0;
    let sellSignals = 0;
    
    // Sinais de compra
    if (priceMovement > 0.5) buySignals++;
    if (close > open) buySignals++;
    if (lowerWick > upperWick) buySignals++;
    if (change24h > 1) buySignals++;
    if (bodySize > (upperWick + lowerWick)) buySignals++; // Corpo forte
    
    // Sinais de venda
    if (priceMovement < -0.5) sellSignals++;
    if (close < open) sellSignals++;
    if (upperWick > lowerWick) sellSignals++;
    if (change24h < -1) sellSignals++;
    
    return buySignals > sellSignals ? 'buy' : 'sell';
  }

  private calculateKlineAlertLevel(volumeIncrease: number, priceMove: number): number {
    let level = 1;
    
    if (volumeIncrease >= 800) level = 5; // Extremo
    else if (volumeIncrease >= 600) level = 4; // Alto
    else if (volumeIncrease >= 450) level = 3; // Médio
    else if (volumeIncrease >= 350) level = 2; // Baixo
    
    // Bonus por movimento de preço
    if (priceMove >= 2) level = Math.min(5, level + 1);
    
    return level;
  }

  private detectLargeOrders(data: FlowData): Alert | null {
    const { ticker, volume, price } = data;
    const orderValue = volume * price;
    
    // Ordem grande: valor > $500K USD
    if (orderValue > 500000) {
      return {
        id: `large-order-${Date.now()}`,
        type: 'large_order',
        ticker,
        timestamp: new Date(),
        details: {
          orderValue: `$${(orderValue / 1e6).toFixed(2)}M`,
          volume: volume.toFixed(0),
          price: price.toFixed(6)
        },
        alert_level: orderValue > 5000000 ? 5 : orderValue > 2000000 ? 4 : orderValue > 1000000 ? 3 : 2,
        direction: data.change_24h > 0 ? 'bullish' : 'bearish',
        price: price,
        amount: orderValue
      };
    }

    return null;
  }

  private detectUnusualVolume(data: FlowData): Alert | null {
    const { ticker, volume, price } = data;
    const history = this.volumeHistory.get(ticker) || [];
    
    if (history.length < 20) return null;

    const avgVolume = history.reduce((sum, v) => sum + v, 0) / history.length;
    const volumeSpike = volume / avgVolume;

    if (volumeSpike > 3.0) {
      return {
        id: Date.now().toString(),
        type: 'unusual_volume',
        ticker,
        timestamp: new Date(),
        details: {
          change: `${volumeSpike.toFixed(1)}X`,
          price: price.toFixed(2),
          volume: volume.toFixed(0),
          avgVolume: avgVolume.toFixed(0),
          direction: data.change_24h > 0 ? 'buy' : 'sell'
        },
        alert_level: this.calculateAlertLevel(volumeSpike),
        direction: data.change_24h > 0 ? 'bullish' : 'bearish',
        price: price
      };
    }

    return null;
  }

  private calculateAlertLevel(intensity: number): number {
    if (intensity >= 5) return 5; // Critical
    if (intensity >= 4) return 4; // High
    if (intensity >= 3) return 3; // Medium
    if (intensity >= 2) return 2; // Low
    return 1; // Minimal
  }

  private updateHistory(data: FlowData) {
    const { ticker, volume, price } = data;
    
    // Atualizar histórico de volume
    const volumeHist = this.volumeHistory.get(ticker) || [];
    volumeHist.push(volume);
    if (volumeHist.length > 100) volumeHist.shift(); // Manter apenas últimos 100
    this.volumeHistory.set(ticker, volumeHist);

    // Atualizar histórico de preço
    const priceHist = this.priceHistory.get(ticker) || [];
    priceHist.push(price);
    if (priceHist.length > 100) priceHist.shift();
    this.priceHistory.set(ticker, priceHist);
  }

  calculateMarketSentiment(allData: FlowData[]): {
    score: number;
    interpretation: string;
    bullish_count: number;
    bearish_count: number;
    neutral_count: number;
  } {
    let bullish = 0;
    let bearish = 0;
    let neutral = 0;

    allData.forEach(data => {
      if (data.change_24h > 2) bullish++;
      else if (data.change_24h < -2) bearish++;
      else neutral++;
    });

    const total = bullish + bearish + neutral;
    const score = total > 0 ? (bullish - bearish) / total : 0;

    let interpretation = 'Neutral';
    if (score > 0.3) interpretation = 'Very Bullish';
    else if (score > 0.1) interpretation = 'Bullish';
    else if (score < -0.3) interpretation = 'Very Bearish';
    else if (score < -0.1) interpretation = 'Bearish';

    return {
      score,
      interpretation,
      bullish_count: bullish,
      bearish_count: bearish,
      neutral_count: neutral
    };
  }

  detectVolumePatterns(ticker: string, timeframe: string = '5m') {
    const volumeHistory = this.volumeHistory.get(ticker) || [];
    const priceHistory = this.priceHistory.get(ticker) || [];
    
    if (volumeHistory.length < 20) return [];

    const patterns = [];

    // Detectar acumulação (volume crescente, preço estável)
    if (this.isAccumulation(volumeHistory, priceHistory)) {
      patterns.push({
        pattern: 'Accumulation',
        tickers: [ticker],
        strength: 75,
        timeframe
      });
    }

    // Detectar distribuição (volume alto, preço em queda)
    if (this.isDistribution(volumeHistory, priceHistory)) {
      patterns.push({
        pattern: 'Distribution',
        tickers: [ticker],
        strength: 80,
        timeframe
      });
    }

    // Detectar breakout (volume explosivo, preço em alta)
    if (this.isBreakout(volumeHistory, priceHistory)) {
      patterns.push({
        pattern: 'Breakout',
        tickers: [ticker],
        strength: 85,
        timeframe
      });
    }

    return patterns;
  }

  private isAccumulation(volumeHistory: number[], priceHistory: number[]): boolean {
    if (volumeHistory.length < 10) return false;
    
    const recentVolume = volumeHistory.slice(-5);
    const earlierVolume = volumeHistory.slice(-10, -5);
    
    const recentAvg = recentVolume.reduce((sum, v) => sum + v, 0) / recentVolume.length;
    const earlierAvg = earlierVolume.reduce((sum, v) => sum + v, 0) / earlierVolume.length;
    
    return recentAvg > earlierAvg * 1.2; // Volume crescendo
  }

  private isDistribution(volumeHistory: number[], priceHistory: number[]): boolean {
    if (volumeHistory.length < 10 || priceHistory.length < 10) return false;
    
    const recentVolume = volumeHistory.slice(-3);
    const recentPrice = priceHistory.slice(-3);
    
    const avgVolume = recentVolume.reduce((sum, v) => sum + v, 0) / recentVolume.length;
    const priceChange = (recentPrice[recentPrice.length - 1] - recentPrice[0]) / recentPrice[0];
    
    return avgVolume > volumeHistory.reduce((sum, v) => sum + v, 0) / volumeHistory.length * 1.5 && priceChange < -0.02;
  }

  private isBreakout(volumeHistory: number[], priceHistory: number[]): boolean {
    if (volumeHistory.length < 5 || priceHistory.length < 5) return false;
    
    const lastVolume = volumeHistory[volumeHistory.length - 1];
    const avgVolume = volumeHistory.reduce((sum, v) => sum + v, 0) / volumeHistory.length;
    const priceChange = (priceHistory[priceHistory.length - 1] - priceHistory[priceHistory.length - 2]) / priceHistory[priceHistory.length - 2];
    
    return lastVolume > avgVolume * 3 && priceChange > 0.03; // Volume 3x + preço em alta
  }
}

export const flowAnalytics = new FlowAnalytics();
