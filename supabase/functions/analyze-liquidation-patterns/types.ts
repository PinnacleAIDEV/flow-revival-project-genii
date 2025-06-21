
export interface LiquidationData {
  asset: string;
  longs: number;
  shorts: number;
  velocity: number;
  ratio: number;
  volume: number;
  price: number;
  avgLongs: number;
  avgShorts: number;
  avgVelocity: number;
  avgVolume: number;
  longHistory: number[];
  shortHistory: number[];
  timestamp: string;
  previousVelocity?: number;
  acceleration?: number;
}

export interface AnalysisRequest {
  unifiedAssets: LiquidationData[];
  timeWindowMinutes: number;
}

export interface PatternResult {
  asset: string;
  pattern: "flip" | "cascade" | "squeeze" | "hunt" | "vacuum";
  confidence: number;
  description: string;
  metrics: {
    liquidationVelocity: number;
    lsRatio: number;
    cascadeProbability: number;
    volumeSpike: number;
  };
  severity: "HIGH" | "MEDIUM" | "LOW";
  nextProbableDirection: "SHORT_LIQUIDATIONS" | "LONG_LIQUIDATIONS";
  reasoning: string;
}

export interface MarketSummary {
  dominantPattern: string;
  overallRisk: string;
  recommendation: string;
  confidence: number;
}

export interface AIAnalysisResponse {
  detectedPatterns: PatternResult[];
  marketSummary: MarketSummary;
}
