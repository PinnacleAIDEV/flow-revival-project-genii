
export interface LongLiquidationAsset {
  asset: string;
  ticker: string;
  price: number;
  marketCap: 'high' | 'mid' | 'low';
  longPositions: number;
  longLiquidated: number;
  lastUpdateTime: Date;
  firstDetectionTime: Date;
  volatility: number;
  intensity: number;
  liquidationHistory: LiquidationHistoryEntry[];
}

export interface ShortLiquidationAsset {
  asset: string;
  ticker: string;
  price: number;
  marketCap: 'high' | 'mid' | 'low';
  shortPositions: number;
  shortLiquidated: number;
  lastUpdateTime: Date;
  firstDetectionTime: Date;
  volatility: number;
  intensity: number;
  liquidationHistory: LiquidationHistoryEntry[];
}

export interface LiquidationHistoryEntry {
  type: 'long' | 'short';
  amount: number;
  timestamp: Date;
  change24h: number;
}

// Estatísticas para liquidações separadas
export interface SeparatedLiquidationStats {
  totalLongAssets: number;
  totalShortAssets: number;
  highCapLongAssets: number;
  highCapShortAssets: number;
  midCapLongAssets: number;
  midCapShortAssets: number;
  lowCapLongAssets: number;
  lowCapShortAssets: number;
  totalLongVolume: number;
  totalShortVolume: number;
  avgIntensity: number;
}
