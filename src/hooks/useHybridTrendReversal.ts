
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Interface para trend reversal (dados combinados)
interface TrendReversalAsset {
  asset: string;
  ticker: string;
  price: number;
  marketCap: 'high' | 'low';
  longPositions: number;
  longLiquidated: number;
  shortPositions: number;
  shortLiquidated: number;
  totalPositions: number;
  combinedTotal: number;
  dominantType: 'long' | 'short';
  lastUpdateTime: Date;
  firstDetectionTime: Date;
  volatility: number;
  intensity: number;
  liquidationHistory: Array<{
    type: 'long' | 'short';
    amount: number;
    timestamp: Date;
    change24h: number;
  }>;
}

interface HybridPattern {
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
  timeframe: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  nextProbableDirection: 'LONG_LIQUIDATIONS' | 'SHORT_LIQUIDATIONS' | 'BALANCED';
  reasoning: string;
  source: 'LOCAL' | 'AI' | 'CACHED';
  alertType: 'iceberg' | 'cascade' | 'squeeze' | 'hunt' | 'vacuum' | 'whale' | 'general';
}

interface HybridAnalysis {
  detectedPatterns: HybridPattern[];
  marketSummary: {
    dominantPattern: string;
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendation: string;
    confidence: number;
  };
  performance: {
    localDetections: number;
    aiCalls: number;
    cacheHits: number;
    tokensUsed: number;
    averageResponseTime: number;
  };
}

export const useHybridTrendReversal = (unifiedAssets: Map<string, TrendReversalAsset>) => {
  const [hybridAnalysis, setHybridAnalysis] = useState<HybridAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<number>(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [performanceStats, setPerformanceStats] = useState({
    localDetections: 0,
    aiCalls: 0,
    cacheHits: 0,
    tokensUsed: 0,
    totalAnalyses: 0,
    tokensSaved: 0,
    averageResponseTime: 0,
    cacheHitRate: 0
  });

  // Preparar dados para análise
  const prepareAnalysisData = useCallback((assets: TrendReversalAsset[]) => {
    return assets.map(asset => {
      const recentHistory = asset.liquidationHistory.slice(-10);
      const longHistory = recentHistory.filter(h => h.type === 'long').map(h => h.amount);
      const shortHistory = recentHistory.filter(h => h.type === 'short').map(h => h.amount);
      
      // Calcular médias dos últimos dados
      const avgLongs = longHistory.length > 0 ? longHistory.reduce((sum, val) => sum + val, 0) / longHistory.length : 0;
      const avgShorts = shortHistory.length > 0 ? shortHistory.reduce((sum, val) => sum + val, 0) / shortHistory.length : 0;
      const totalVolume = asset.longLiquidated + asset.shortLiquidated;
      
      // Calcular velocidade de liquidação (últimos 5 minutos)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentLiquids = recentHistory.filter(h => new Date(h.timestamp) > fiveMinutesAgo);
      const velocity = recentLiquids.reduce((sum, h) => sum + h.amount, 0) / 5; // por minuto

      return {
        asset: asset.asset,
        longs: asset.longLiquidated,
        shorts: asset.shortLiquidated,
        velocity: velocity,
        ratio: asset.shortLiquidated > 0 ? asset.longLiquidated / asset.shortLiquidated : asset.longLiquidated,
        volume: totalVolume,
        price: asset.price,
        avgLongs: Math.max(avgLongs, 1),
        avgShorts: Math.max(avgShorts, 1),
        avgVelocity: Math.max(velocity * 0.5, 1),
        avgVolume: Math.max(totalVolume * 0.6, 1),
        longHistory: longHistory,
        shortHistory: shortHistory,
        timestamp: asset.lastUpdateTime,
        previousVelocity: velocity * 0.8,
        acceleration: velocity * 0.2
      };
    });
  }, []);

  // Detecção local de padrões
  const detectLocalPatterns = (data: any): HybridPattern | null => {
    const { longs, shorts, velocity, ratio, volume } = data;
    
    // Detecção básica de padrões
    if (velocity > 50 && ratio > 3) {
      return {
        asset: data.asset,
        pattern: "flip" as const,
        confidence: 0.7,
        description: "Possível reversão detectada",
        metrics: {
          liquidationVelocity: velocity,
          lsRatio: ratio,
          cascadeProbability: 0.6,
          volumeSpike: volume / 1000
        },
        timeframe: '5min',
        severity: 'MEDIUM',
        nextProbableDirection: 'SHORT_LIQUIDATIONS',
        reasoning: "Alta velocidade de liquidação com ratio L/S elevado",
        source: 'LOCAL',
        alertType: 'iceberg'
      };
    }
    
    if (velocity > 100 && Math.abs(ratio - 1) < 0.5) {
      return {
        asset: data.asset,
        pattern: "squeeze" as const,
        confidence: 0.8,
        description: "Squeeze bilateral detectado",
        metrics: {
          liquidationVelocity: velocity,
          lsRatio: ratio,
          cascadeProbability: 0.7,
          volumeSpike: volume / 1000
        },
        timeframe: '5min',
        severity: 'HIGH',
        nextProbableDirection: 'BALANCED',
        reasoning: "Liquidações equilibradas com alta velocidade",
        source: 'LOCAL',
        alertType: 'squeeze'
      };
    }
    
    return null;
  };

  // Análise híbrida principal
  const analyzePatterns = useCallback(async () => {
    if (unifiedAssets.size === 0) return;

    const startTime = performance.now();
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const assetsArray = Array.from(unifiedAssets.values());
      const activeAssets = assetsArray.filter(asset => {
        const lastUpdate = new Date(asset.lastUpdateTime);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return lastUpdate > fiveMinutesAgo && asset.liquidationHistory.length >= 2;
      });

      if (activeAssets.length === 0) {
        setHybridAnalysis({
          detectedPatterns: [],
          marketSummary: {
            dominantPattern: "NO_ACTIVITY",
            overallRisk: "LOW",
            recommendation: "Monitorando mercado em busca de atividade de liquidação",
            confidence: 0
          },
          performance: {
            localDetections: 0,
            aiCalls: 0,
            cacheHits: 0,
            tokensUsed: 0,
            averageResponseTime: 0
          }
        });
        return;
      }

      const processedData = prepareAnalysisData(activeAssets);
      const detectedPatterns: HybridPattern[] = [];
      let localDetectionsThisRound = 0;

      // Análise para cada asset
      for (const data of processedData) {
        const pattern = detectLocalPatterns(data);
        if (pattern && pattern.confidence > 0.5) {
          detectedPatterns.push(pattern);
          localDetectionsThisRound++;
        }
      }

      // Calcular estatísticas de mercado
      const marketSummary = calculateMarketSummary(detectedPatterns);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Atualizar estatísticas de performance
      setPerformanceStats(prev => ({
        localDetections: prev.localDetections + localDetectionsThisRound,
        aiCalls: prev.aiCalls,
        cacheHits: prev.cacheHits,
        tokensUsed: prev.tokensUsed,
        totalAnalyses: prev.totalAnalyses + 1,
        tokensSaved: prev.tokensSaved + 85, // Estimativa de tokens salvos usando detecção local
        averageResponseTime: (prev.averageResponseTime + responseTime) / 2,
        cacheHitRate: prev.cacheHits > 0 ? (prev.cacheHits / prev.totalAnalyses) * 100 : 0
      }));

      setHybridAnalysis({
        detectedPatterns: detectedPatterns.sort((a, b) => b.confidence - a.confidence),
        marketSummary,
        performance: {
          localDetections: localDetectionsThisRound,
          aiCalls: 0,
          cacheHits: 0,
          tokensUsed: 0,
          averageResponseTime: responseTime
        }
      });

      setLastAnalysis(Date.now());
      console.log(`✅ Análise híbrida concluída: ${detectedPatterns.length} padrões, ${localDetectionsThisRound} local`);

    } catch (error) {
      console.error('❌ Erro na análise híbrida:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsAnalyzing(false);
    }
  }, [unifiedAssets, prepareAnalysisData]);

  // Calcular resumo do mercado
  const calculateMarketSummary = (patterns: HybridPattern[]) => {
    if (patterns.length === 0) {
      return {
        dominantPattern: "MONITORING",
        overallRisk: "LOW" as const,
        recommendation: "Mercado estável, monitorando padrões de liquidação",
        confidence: 0
      };
    }

    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    const criticalCount = patterns.filter(p => p.severity === 'CRITICAL').length;
    const highCount = patterns.filter(p => p.severity === 'HIGH').length;
    
    const dominantPattern = patterns[0]?.pattern || "MIXED";
    
    let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let recommendation = "";

    if (criticalCount > 0) {
      overallRisk = 'CRITICAL';
      recommendation = `${criticalCount} padrões críticos detectados. Atenção máxima recomendada.`;
    } else if (highCount > 2) {
      overallRisk = 'HIGH';
      recommendation = `Múltiplos padrões de alta severidade. Monitorar posições de perto.`;
    } else if (patterns.length > 3) {
      overallRisk = 'MEDIUM';
      recommendation = `Atividade moderada de liquidação. Cautela recomendada.`;
    } else {
      recommendation = `${patterns.length} padrão(ões) detectado(s). Mercado ativo mas controlado.`;
    }

    return {
      dominantPattern,
      overallRisk,
      recommendation,
      confidence: avgConfidence
    };
  };

  // Análise automática a cada 10 segundos
  useEffect(() => {
    const now = Date.now();
    const shouldAnalyze = unifiedAssets.size > 0 && (now - lastAnalysis > 10000); // 10 segundos
    
    if (shouldAnalyze && !isAnalyzing) {
      analyzePatterns();
    }
  }, [unifiedAssets, lastAnalysis, isAnalyzing, analyzePatterns]);

  // Filtros para diferentes tipos de padrões
  const getIcebergAlerts = () => hybridAnalysis?.detectedPatterns.filter(p => p.alertType === 'iceberg') || [];
  const getCascadeAlerts = () => hybridAnalysis?.detectedPatterns.filter(p => p.alertType === 'cascade') || [];
  const getSqueezeAlerts = () => hybridAnalysis?.detectedPatterns.filter(p => p.alertType === 'squeeze') || [];
  const getCriticalAlerts = () => hybridAnalysis?.detectedPatterns.filter(p => p.severity === 'CRITICAL') || [];

  return {
    hybridAnalysis,
    isAnalyzing,
    analysisError,
    performanceStats,
    analyzePatterns,
    getIcebergAlerts,
    getCascadeAlerts,
    getSqueezeAlerts,
    getCriticalAlerts,
    hasData: (hybridAnalysis?.detectedPatterns.length || 0) > 0
  };
};
