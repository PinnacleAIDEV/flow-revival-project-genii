

export interface LiquidationBubble {
  id: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  marketCap: 'high' | 'mid' | 'low';
  timestamp: Date;
  intensity: number;
  change24h: number;
  volume: number;
  lastUpdateTime: Date;
  totalLiquidated: number;
}

export interface TrendReversal {
  asset: string;
  previousType: 'long' | 'short';
  currentType: 'long' | 'short';
  previousVolume: number;
  currentVolume: number;
  reversalRatio: number;
  timestamp: Date;
  intensity: number;
  price: number;
  marketCap: 'high' | 'mid' | 'low';
  
  positionsCount: {
    previousPeriod: { long: number; short: number; };
    currentPeriod: { long: number; short: number; };
  };
  sentimentShift: {
    description: string;
    confidence: number;
    indicators: string[];
  };
  timeframe: string;
}

// ATUALIZADO: Classificação de market cap baseada em valores reais de mercado
// HIGH CAP: >= $10B | MID CAP: $1B-$10B | LOW CAP: < $1B
export const getMarketCapCategory = (ticker: string): 'high' | 'mid' | 'low' => {
  // Esta função agora é apenas fallback - usar marketCapService para dados reais
  const symbol = ticker.replace('USDT', '').replace('USDC', '').replace('BUSD', '');
  
  const highCapSymbols = new Set([
    'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'DOT', 'LINK', 'MATIC', 'AVAX', 'LTC', 'BCH'
  ]);

  const midCapSymbols = new Set([
    'UNI', 'ATOM', 'XLM', 'VET', 'FIL', 'ETC', 'MANA', 'SAND', 'AXS', 'APE', 'CHZ', 'GALA', 
    'ENJ', 'FLOW', 'ICP', 'THETA', 'XTZ', 'MKR', 'FTM', 'AAVE', 'SNX', 'CRV', 'COMP',
    'ARB', 'OP', 'LDO', 'INJ', 'SUI', 'APT', 'STX', 'MINA', 'TON', 'HBAR', 'RENDER', 'IMX', 'FET', 'GRT'
  ]);

  if (highCapSymbols.has(symbol)) return 'high';
  if (midCapSymbols.has(symbol)) return 'mid';
  return 'low';
};

export interface LiquidationStats {
  totalLong: number;
  totalShort: number;
  highCapLong: number;
  highCapShort: number;
  midCapLong: number;
  midCapShort: number;
  lowCapLong: number;
  lowCapShort: number;
}

export interface DetectionConfig {
  minLiquidationsPerType: number;
  maxLiquidationsPerType: number;
  highCapRatio: number;
  midCapRatio: number;
  lowCapRatio: number;
}

export const defaultDetectionConfig: DetectionConfig = {
  minLiquidationsPerType: 3, // Reduzido para economizar dados
  maxLiquidationsPerType: 10, // Reduzido para economizar dados
  highCapRatio: 0.4,
  midCapRatio: 0.3,
  lowCapRatio: 0.3
};

