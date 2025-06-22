
export interface UnifiedTrendReversalAsset {
  asset: string;
  ticker: string;
  price: number;
  marketCap: 'high' | 'mid' | 'low';
  
  // Separated liquidation data
  longPositions: number;
  longLiquidated: number;
  shortPositions: number;
  shortLiquidated: number;
  
  // Combined metrics
  totalPositions: number;
  combinedTotal: number;
  dominantType: 'long' | 'short';
  
  // Temporal data
  lastUpdateTime: Date;
  firstDetectionTime: Date;
  
  // Analysis metrics
  intensity: number;
  
  // Unified liquidation history
  liquidationHistory: Array<{
    id: string;
    type: 'long' | 'short';
    amount: number;
    timestamp: Date;
    change24h: number;
  }>;
}

export interface TrendReversalData {
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
  timeframe: string;
  confidence: number;
}
