import { FlowData, Alert } from './BinanceWebSocketService';

export class FlowAnalytics {
  private volumeHistory: Map<string, number[]> = new Map();
  private priceHistory: Map<string, number[]> = new Map();
  private vwapTracker: Map<string, { position: string; vwap: number }> = new Map();
  private timeframes = {
    '1m': 60000,
    '3m': 180000,
    '5m': 300000,
    '30m': 1800000,
    '1h': 3600000,
    '1d': 86400000
  };

  analyzeFlowData(data: FlowData): Alert[] {
    const alerts: Alert[] = [];

    // Detectar volume anormal
    const volumeAlert = this.detectUnusualVolume(data);
    if (volumeAlert) alerts.push(volumeAlert);

    // Detectar cruzamentos VWAP
    const vwapAlert = this.detectVWAPCross(data);
    if (vwapAlert) alerts.push(vwapAlert);

    // Detectar movimentos climáticos
    const climaticAlert = this.detectClimaticMove(data);
    if (climaticAlert) alerts.push(climaticAlert);

    // Atualizar histórico
    this.updateHistory(data);

    return alerts;
  }

  private detectUnusualVolume(data: FlowData): Alert | null {
    const { ticker, volume, price } = data;
    const history = this.volumeHistory.get(ticker) || [];
    
    if (history.length < 20) return null; // Precisa de histórico mínimo

    const avgVolume = history.reduce((sum, v) => sum + v, 0) / history.length;
    const volumeSpike = volume / avgVolume;

    if (volumeSpike > 3.0) { // Volume 3x maior que média
      return {
        id: Date.now().toString(),
        type: 'unusual_volume',
        ticker,
        timestamp: new Date(),
        details: {
          change: `${volumeSpike.toFixed(1)}X`,
          price: price.toFixed(2),
          volume: volume.toFixed(0),
          avgVolume: avgVolume.toFixed(0)
        },
        alert_level: this.calculateAlertLevel(volumeSpike),
        direction: data.change_24h > 0 ? 'bullish' : 'bearish',
        price: price
      };
    }

    return null;
  }

  private detectVWAPCross(data: FlowData): Alert | null {
    const { ticker, price, vwap } = data;
    const tracker = this.vwapTracker.get(ticker);
    
    const currentPosition = price > vwap ? 'above' : 'below';
    
    if (tracker && tracker.position !== currentPosition) {
      this.vwapTracker.set(ticker, { position: currentPosition, vwap });
      
      return {
        id: Date.now().toString(),
        type: 'vwap_cross',
        ticker,
        timestamp: new Date(),
        details: {
          direction: currentPosition === 'above' ? 'bullish' : 'bearish',
          price: price.toFixed(2),
          vwap: vwap.toFixed(2),
          crossType: `Price crossed ${currentPosition} VWAP`
        },
        alert_level: 2,
        direction: currentPosition === 'above' ? 'bullish' : 'bearish',
        price: price
      };
    }

    this.vwapTracker.set(ticker, { position: currentPosition, vwap });
    return null;
  }

  private detectClimaticMove(data: FlowData): Alert | null {
    const { ticker, change_24h, volume, price } = data;
    const volumeHistory = this.volumeHistory.get(ticker) || [];
    
    if (volumeHistory.length < 10) return null;

    const avgVolume = volumeHistory.reduce((sum, v) => sum + v, 0) / volumeHistory.length;
    const volumeSpike = volume / avgVolume;
    
    // Movimento climático: mudança de preço > 5% E volume > 2x média
    if (Math.abs(change_24h) > 5.0 && volumeSpike > 2.0) {
      return {
        id: Date.now().toString(),
        type: 'climactic_move',
        ticker,
        timestamp: new Date(),
        details: {
          direction: change_24h > 0 ? 'up' : 'down',
          priceChange: `${change_24h.toFixed(2)}%`,
          volumeSpike: `${volumeSpike.toFixed(1)}X`,
          significance: 'High'
        },
        alert_level: this.calculateAlertLevel(Math.abs(change_24h) / 5 + volumeSpike / 2),
        direction: change_24h > 0 ? 'up' : 'down',
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
