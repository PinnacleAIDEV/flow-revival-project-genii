
import { LiquidationData } from './types.ts';

export function compressData(unifiedAssets: LiquidationData[]) {
  return unifiedAssets.map(asset => ({
    a: asset.asset,
    l: asset.longs,
    s: asset.shorts,
    v: asset.velocity,
    r: asset.ratio,
    vol: asset.volume,
    p: asset.price
  }));
}

export function createFallbackResponse(reason: string) {
  return {
    detectedPatterns: [],
    marketSummary: { 
      dominantPattern: "ERROR", 
      overallRisk: "LOW", 
      recommendation: `Usando fallback local: ${reason}`,
      confidence: 0
    }
  };
}

export function createNoDataResponse() {
  return {
    detectedPatterns: [],
    marketSummary: { 
      dominantPattern: "NO_DATA", 
      overallRisk: "LOW", 
      recommendation: "Aguardando dados de liquidação",
      confidence: 0
    }
  };
}

export function createConfigErrorResponse() {
  return {
    error: 'OPENAI_API_KEY não configurado',
    detectedPatterns: [],
    marketSummary: { 
      dominantPattern: "CONFIG_ERROR", 
      overallRisk: "UNKNOWN", 
      recommendation: "Configure a API Key do OpenAI",
      confidence: 0
    }
  };
}
