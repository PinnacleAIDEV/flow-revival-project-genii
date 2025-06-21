
// Interfaces específicas para Long e Short liquidations
export interface LongLiquidationAsset {
  asset: string;
  ticker: string;
  price: number;
  marketCap: 'high' | 'low';
  
  // Apenas dados LONG
  longPositions: number;
  longLiquidated: number;
  
  // Dados temporais
  lastUpdateTime: Date;
  firstDetectionTime: Date;
  
  // Métricas de análise
  volatility: number;
  intensity: number;
  
  // Histórico apenas LONG
  liquidationHistory: Array<{
    type: 'long';
    amount: number;
    timestamp: Date;
    change24h: number;
  }>;
}

export interface ShortLiquidationAsset {
  asset: string;
  ticker: string;
  price: number;
  marketCap: 'high' | 'low';
  
  // Apenas dados SHORT
  shortPositions: number;
  shortLiquidated: number;
  
  // Dados temporais
  lastUpdateTime: Date;
  firstDetectionTime: Date;
  
  // Métricas de análise
  volatility: number;
  intensity: number;
  
  // Histórico apenas SHORT
  liquidationHistory: Array<{
    type: 'short';
    amount: number;
    timestamp: Date;
    change24h: number;
  }>;
}
