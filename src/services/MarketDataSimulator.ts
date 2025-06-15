
interface MarketTicker {
  symbol: string;
  price: number;
  basePrice: number;
  volatility: number;
  trend: number;
  volume: number;
  baseVolume: number;
  lastUpdate: number;
}

interface MarketDataUpdate {
  symbol: string;
  price: number;
  volume: number;
  change24h: number;
  high24h: number;
  low24h: number;
  vwap: number;
  trades: number;
  timestamp: number;
}

export class MarketDataSimulator {
  private tickers: Map<string, MarketTicker> = new Map();
  private subscribers: ((data: MarketDataUpdate) => void)[] = [];
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;

  private symbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT',
    'DOTUSDT', 'MATICUSDT', 'AVAXUSDT', 'LINKUSDT', 'UNIUSDT',
    'LTCUSDT', 'XLMUSDT', 'VETUSDT', 'FILUSDT', 'TRXUSDT',
    'ETCUSDT', 'XMRUSDT', 'AAVEUSDT', 'EOSUSDT', 'XTZUSDT'
  ];

  private basePrices: Record<string, number> = {
    'BTCUSDT': 43250.00,
    'ETHUSDT': 2580.50,
    'BNBUSDT': 315.75,
    'ADAUSDT': 0.485,
    'SOLUSDT': 98.25,
    'DOTUSDT': 7.85,
    'MATICUSDT': 0.935,
    'AVAXUSDT': 38.50,
    'LINKUSDT': 14.75,
    'UNIUSDT': 6.85,
    'LTCUSDT': 72.50,
    'XLMUSDT': 0.115,
    'VETUSDT': 0.028,
    'FILUSDT': 5.25,
    'TRXUSDT': 0.105,
    'ETCUSDT': 20.75,
    'XMRUSDT': 158.50,
    'AAVEUSDT': 95.25,
    'EOSUSDT': 0.65,
    'XTZUSDT': 0.98
  };

  constructor() {
    this.initializeTickers();
  }

  private initializeTickers() {
    this.symbols.forEach(symbol => {
      const basePrice = this.basePrices[symbol] || 1.0;
      this.tickers.set(symbol, {
        symbol,
        price: basePrice,
        basePrice,
        volatility: 0.02 + Math.random() * 0.03, // 2-5% volatilidade
        trend: (Math.random() - 0.5) * 0.1, // -5% a +5% trend
        volume: Math.random() * 1000000 + 100000,
        baseVolume: Math.random() * 1000000 + 100000,
        lastUpdate: Date.now()
      });
    });
  }

  private updateTicker(ticker: MarketTicker): MarketDataUpdate {
    const now = Date.now();
    const timeDelta = (now - ticker.lastUpdate) / 1000; // segundos
    
    // Movimento browniano com tendência
    const randomChange = (Math.random() - 0.5) * ticker.volatility * Math.sqrt(timeDelta);
    const trendChange = ticker.trend * timeDelta / 3600; // trend por hora
    
    ticker.price *= (1 + randomChange + trendChange);
    
    // Manter preço dentro de limites razoáveis
    const maxDeviation = 0.3; // 30% do preço base
    if (ticker.price > ticker.basePrice * (1 + maxDeviation)) {
      ticker.price = ticker.basePrice * (1 + maxDeviation);
      ticker.trend = -Math.abs(ticker.trend); // reverter tendência
    } else if (ticker.price < ticker.basePrice * (1 - maxDeviation)) {
      ticker.price = ticker.basePrice * (1 - maxDeviation);
      ticker.trend = Math.abs(ticker.trend); // reverter tendência
    }

    // Atualizar volume com alguma correlação ao movimento de preço
    const volumeMultiplier = 1 + Math.abs(randomChange) * 5;
    ticker.volume = ticker.baseVolume * volumeMultiplier * (0.5 + Math.random());

    // Calcular mudança 24h (simulada)
    const change24h = ((ticker.price - ticker.basePrice) / ticker.basePrice) * 100;
    
    // VWAP simulado (preço médio ponderado por volume)
    const vwap = ticker.price * (0.98 + Math.random() * 0.04);

    ticker.lastUpdate = now;

    return {
      symbol: ticker.symbol,
      price: ticker.price,
      volume: ticker.volume,
      change24h,
      high24h: ticker.price * (1 + Math.random() * 0.1),
      low24h: ticker.price * (1 - Math.random() * 0.1),
      vwap,
      trades: Math.floor(Math.random() * 1000) + 100,
      timestamp: now
    };
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Starting Market Data Simulator...');

    // Atualizar dados a cada 1-3 segundos de forma aleatória
    const updateLoop = () => {
      if (!this.isRunning) return;

      // Selecionar alguns tickers aleatórios para atualizar
      const tickersToUpdate = Array.from(this.tickers.values())
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 + Math.floor(Math.random() * 5)); // 3-8 tickers por update

      tickersToUpdate.forEach(ticker => {
        const update = this.updateTicker(ticker);
        this.notifySubscribers(update);
      });

      // Próxima atualização em 1-3 segundos
      const nextUpdate = 1000 + Math.random() * 2000;
      this.interval = setTimeout(updateLoop, nextUpdate);
    };

    updateLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }
    console.log('🛑 Market Data Simulator stopped');
  }

  subscribe(callback: (data: MarketDataUpdate) => void) {
    this.subscribers.push(callback);
    
    // Enviar dados iniciais
    Array.from(this.tickers.values()).forEach(ticker => {
      const update = this.updateTicker(ticker);
      callback(update);
    });
  }

  unsubscribe(callback: (data: MarketDataUpdate) => void) {
    const index = this.subscribers.indexOf(callback);
    if (index > -1) {
      this.subscribers.splice(index, 1);
    }
  }

  private notifySubscribers(data: MarketDataUpdate) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Método para obter todos os tickers atuais
  getAllTickers(): MarketDataUpdate[] {
    return Array.from(this.tickers.values()).map(ticker => this.updateTicker(ticker));
  }

  // Método para simular eventos especiais
  triggerMarketEvent(type: 'pump' | 'dump' | 'volatility') {
    const affectedTickers = Array.from(this.tickers.values())
      .sort(() => Math.random() - 0.5)
      .slice(0, 2 + Math.floor(Math.random() * 3));

    affectedTickers.forEach(ticker => {
      switch (type) {
        case 'pump':
          ticker.trend += 0.05; // 5% trend adicional para cima
          ticker.volatility *= 1.5;
          break;
        case 'dump':
          ticker.trend -= 0.05; // 5% trend adicional para baixo
          ticker.volatility *= 1.5;
          break;
        case 'volatility':
          ticker.volatility *= 2;
          break;
      }
    });

    console.log(`🎯 Market event triggered: ${type} affecting ${affectedTickers.length} tickers`);
  }
}

export const marketDataSimulator = new MarketDataSimulator();
