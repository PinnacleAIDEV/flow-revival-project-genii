
import { useState, useEffect, useCallback } from 'react';

// Interface para padrões detectados localmente
interface LocalPattern {
  pattern: 'cascade' | 'flip' | 'squeeze' | 'hunt' | 'vacuum' | 'pendulum' | 'whale' | 'stairway';
  confidence: number;
  direction: 'bullish' | 'bearish' | 'volatile' | 'reversal' | 'up' | 'down';
  risk: 'low' | 'medium' | 'high' | 'extreme' | 'critical';
  metrics: {
    liquidationVelocity: number;
    lsRatio: number;
    cascadeProbability: number;
    volumeSpike: number;
  };
  reasoning: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  nextProbableDirection: 'LONG_LIQUIDATIONS' | 'SHORT_LIQUIDATIONS' | 'BALANCED';
}

// Interface para dados de liquidação processados
interface ProcessedLiquidationData {
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
  timestamp: Date;
  previousVelocity?: number;
  acceleration?: number;
}

export const useLiquidationPatternDetector = () => {
  const [detectedPatterns, setDetectedPatterns] = useState<Map<string, LocalPattern>>(new Map());
  const [analysisCache, setAnalysisCache] = useState<Map<string, { data: ProcessedLiquidationData; result: LocalPattern; timestamp: number }>>(new Map());
  const [tokenUsageStats, setTokenUsageStats] = useState({
    tokensUsed: 0,
    apiCalls: 0,
    cacheHits: 0,
    localDetections: 0
  });

  // Detector de Liquidation Cascade
  const detectCascade = useCallback((data: ProcessedLiquidationData): LocalPattern => {
    const acceleration = (data.velocity - (data.previousVelocity || 0));
    const velocitySpike = data.velocity / data.avgVelocity;
    
    let confidence = 0;
    if (velocitySpike > 3 && acceleration > 50) confidence = 0.95;
    else if (velocitySpike > 2.5 && acceleration > 30) confidence = 0.85;
    else if (velocitySpike > 2 && acceleration > 20) confidence = 0.75;
    else if (velocitySpike > 1.5 && acceleration > 10) confidence = 0.6;
    else confidence = 0.3;

    const direction = data.longs > data.shorts ? 'bearish' : 'bullish';
    const risk = confidence > 0.8 ? 'extreme' : confidence > 0.6 ? 'high' : 'medium';

    return {
      pattern: 'cascade',
      confidence,
      direction,
      risk,
      metrics: {
        liquidationVelocity: data.velocity,
        lsRatio: data.ratio,
        cascadeProbability: Math.min(1, velocitySpike / 3),
        volumeSpike: velocitySpike
      },
      reasoning: `Cascade detected: velocity ${velocitySpike.toFixed(1)}x above average, acceleration ${acceleration.toFixed(0)}/min`,
      severity: confidence > 0.9 ? 'CRITICAL' : confidence > 0.7 ? 'HIGH' : 'MEDIUM',
      nextProbableDirection: direction === 'bearish' ? 'LONG_LIQUIDATIONS' : 'SHORT_LIQUIDATIONS'
    };
  }, []);

  // Detector de Liquidation Flip (Iceberg Pattern)
  const detectFlip = useCallback((data: ProcessedLiquidationData): LocalPattern => {
    const longTrend = data.longHistory.slice(-5);
    const shortTrend = data.shortHistory.slice(-3);
    
    // Detectar se longs estavam altos e agora shorts estão aumentando
    const longDecreasing = longTrend.length >= 3 && 
      longTrend[longTrend.length - 1] < longTrend[0] && 
      longTrend.reduce((sum, val) => sum + val, 0) > data.avgLongs * 2;
    
    const shortIncreasing = shortTrend.length >= 2 && 
      shortTrend[shortTrend.length - 1] > shortTrend[0] && 
      shortTrend[shortTrend.length - 1] > data.avgShorts * 1.5;

    const flipSpeed = shortTrend.length > 1 ? 
      (shortTrend[shortTrend.length - 1] - shortTrend[0]) / shortTrend.length : 0;

    let confidence = 0;
    if (longDecreasing && shortIncreasing && flipSpeed > data.avgShorts) confidence = 0.88;
    else if (longDecreasing && shortIncreasing) confidence = 0.75;
    else if (shortIncreasing && data.shorts > data.longs * 0.7) confidence = 0.65;
    else confidence = 0.3;

    return {
      pattern: 'flip',
      confidence,
      direction: 'reversal',
      risk: confidence > 0.8 ? 'high' : 'medium',
      metrics: {
        liquidationVelocity: flipSpeed,
        lsRatio: data.ratio,
        cascadeProbability: confidence,
        volumeSpike: data.volume / data.avgVolume
      },
      reasoning: `Liquidation Flip: Heavy longs (${(longTrend.reduce((sum, val) => sum + val, 0) / 1000).toFixed(0)}K) followed by strong shorts (${(data.shorts / 1000).toFixed(0)}K)`,
      severity: confidence > 0.85 ? 'HIGH' : 'MEDIUM',
      nextProbableDirection: 'SHORT_LIQUIDATIONS'
    };
  }, []);

  // Detector de Squeeze Pattern
  const detectSqueeze = useCallback((data: ProcessedLiquidationData): LocalPattern => {
    const bothHigh = data.longs > data.avgLongs * 1.5 && data.shorts > data.avgShorts * 1.5;
    const simultaneousSpike = Math.abs(data.longs - data.shorts) < (data.longs + data.shorts) * 0.3;
    const volatilityIndicator = (data.longs + data.shorts) / (data.avgLongs + data.avgShorts);
    
    let confidence = 0;
    if (bothHigh && simultaneousSpike && volatilityIndicator > 3) confidence = 0.9;
    else if (bothHigh && simultaneousSpike) confidence = 0.75;
    else if (bothHigh) confidence = 0.6;
    else confidence = 0.25;

    return {
      pattern: 'squeeze',
      confidence,
      direction: 'volatile',
      risk: confidence > 0.7 ? 'extreme' : 'high',
      metrics: {
        liquidationVelocity: data.velocity,
        lsRatio: data.ratio,
        cascadeProbability: volatilityIndicator / 4,
        volumeSpike: volatilityIndicator
      },
      reasoning: `Squeeze Pattern: Bilateral liquidations - Longs: ${(data.longs/1000).toFixed(0)}K, Shorts: ${(data.shorts/1000).toFixed(0)}K`,
      severity: confidence > 0.85 ? 'CRITICAL' : 'HIGH',
      nextProbableDirection: 'BALANCED'
    };
  }, []);

  // Detector de Liquidation Vacuum
  const detectVacuum = useCallback((data: ProcessedLiquidationData): LocalPattern => {
    const volumeDrop = data.volume < data.avgVolume * 0.4;
    const highLiquidations = (data.longs + data.shorts) > (data.avgLongs + data.avgShorts) * 2.5;
    const asymmetric = Math.abs(data.longs - data.shorts) > (data.longs + data.shorts) * 0.7;
    
    let confidence = 0;
    if (volumeDrop && highLiquidations && asymmetric) confidence = 0.85;
    else if (highLiquidations && asymmetric) confidence = 0.7;
    else if (volumeDrop && highLiquidations) confidence = 0.6;
    else confidence = 0.3;

    const direction = data.longs > data.shorts ? 'down' : 'up';

    return {
      pattern: 'vacuum',
      confidence,
      direction,
      risk: confidence > 0.8 ? 'extreme' : 'critical',
      metrics: {
        liquidationVelocity: data.velocity,
        lsRatio: data.ratio,
        cascadeProbability: confidence,
        volumeSpike: (data.longs + data.shorts) / (data.avgLongs + data.avgShorts)
      },
      reasoning: `Vacuum Pattern: Low volume (${(data.volume/1000).toFixed(0)}K) with heavy ${data.longs > data.shorts ? 'long' : 'short'} liquidations`,
      severity: 'CRITICAL',
      nextProbableDirection: data.longs > data.shorts ? 'LONG_LIQUIDATIONS' : 'SHORT_LIQUIDATIONS'
    };
  }, []);

  // Detector de Hunt & Liquidate
  const detectHunt = useCallback((data: ProcessedLiquidationData): LocalPattern => {
    const recentSpike = data.velocity > data.avgVelocity * 4;
    const quickReversal = data.longHistory.length >= 2 && data.shortHistory.length >= 2 &&
      Math.abs(data.longHistory[data.longHistory.length - 1] - data.shortHistory[data.shortHistory.length - 1]) > 
      (data.avgLongs + data.avgShorts);
    
    const huntIndicator = recentSpike && quickReversal;
    
    let confidence = huntIndicator ? 0.8 : 0.35;

    return {
      pattern: 'hunt',
      confidence,
      direction: 'reversal',
      risk: 'high',
      metrics: {
        liquidationVelocity: data.velocity,
        lsRatio: data.ratio,
        cascadeProbability: confidence,
        volumeSpike: data.velocity / data.avgVelocity
      },
      reasoning: `Hunt Pattern: Rapid spike (${data.velocity.toFixed(0)}/min) followed by reversal`,
      severity: confidence > 0.75 ? 'HIGH' : 'MEDIUM',
      nextProbableDirection: data.longs > data.shorts ? 'SHORT_LIQUIDATIONS' : 'LONG_LIQUIDATIONS'
    };
  }, []);

  // Função principal para detectar padrões localmente
  const detectLocalPatterns = useCallback((data: ProcessedLiquidationData): LocalPattern | null => {
    const patterns = [
      detectCascade(data),
      detectFlip(data),
      detectSqueeze(data),
      detectVacuum(data),
      detectHunt(data)
    ];

    // Encontrar padrão com maior confiança
    const bestPattern = patterns.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    // Só retorna se confiança >= 70%
    if (bestPattern.confidence >= 0.7) {
      setTokenUsageStats(prev => ({ ...prev, localDetections: prev.localDetections + 1 }));
      return bestPattern;
    }

    return null;
  }, [detectCascade, detectFlip, detectSqueeze, detectVacuum, detectHunt]);

  // Sistema de cache com similaridade
  const getCachedAnalysis = useCallback((data: ProcessedLiquidationData): LocalPattern | null => {
    for (const [key, cached] of analysisCache.entries()) {
      const similarity = calculateSimilarity(data, cached.data);
      if (similarity > 0.85) {
        setTokenUsageStats(prev => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
        return {
          ...cached.result,
          confidence: cached.result.confidence * similarity
        };
      }
    }
    return null;
  }, [analysisCache]);

  // Calcular similaridade entre datasets
  const calculateSimilarity = (data1: ProcessedLiquidationData, data2: ProcessedLiquidationData): number => {
    const features = ['longs', 'shorts', 'velocity', 'ratio'];
    let similarity = 0;
    
    features.forEach(feature => {
      const val1 = data1[feature as keyof ProcessedLiquidationData] as number;
      const val2 = data2[feature as keyof ProcessedLiquidationData] as number;
      const diff = Math.abs(val1 - val2);
      const avg = (val1 + val2) / 2;
      if (avg > 0) {
        similarity += Math.max(0, 1 - (diff / avg));
      }
    });
    
    return similarity / features.length;
  };

  // Calcular prioridade para análise
  const calculatePriority = (data: ProcessedLiquidationData): 'low' | 'medium' | 'high' => {
    const volatility = data.velocity / Math.max(data.avgVelocity, 1);
    const volume = (data.longs + data.shorts) / Math.max((data.avgLongs + data.avgShorts), 1);
    
    if (volatility > 3 || volume > 5) return 'high';
    if (volatility > 1.5 || volume > 2) return 'medium';
    return 'low';
  };

  // Limpar cache periodicamente
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      
      setAnalysisCache(prev => {
        const cleaned = new Map();
        prev.forEach((value, key) => {
          if (value.timestamp > fiveMinutesAgo) {
            cleaned.set(key, value);
          }
        });
        return cleaned;
      });
    }, 60000); // Limpar a cada minuto

    return () => clearInterval(cleanup);
  }, []);

  return {
    detectLocalPatterns,
    getCachedAnalysis,
    calculatePriority,
    detectedPatterns,
    tokenUsageStats,
    setAnalysisCache
  };
};
