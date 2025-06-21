
import { useState, useEffect, useCallback } from 'react';
import { useLiquidationPatternDetector } from './useLiquidationPatternDetector';
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
  pattern: string;
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
  const {
    detectLocalPatterns,
    getCachedAnalysis,
    calculatePriority,
    tokenUsageStats,
    setAnalysisCache
  } = useLiquidationPatternDetector();

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
    averageResponseTime: 0
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
        avgVelocity: Math.max(velocity * 0.5, 1), // Estimate baseline
        avgVolume: Math.max(totalVolume * 0.6, 1), // Estimate baseline
        longHistory: longHistory,
        shortHistory: shortHistory,
        timestamp: asset.lastUpdateTime,
        previousVelocity: velocity * 0.8, // Estimate previous
        acceleration: velocity * 0.2 // Estimate acceleration
      };
    });
  }, []);

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
            localDetections: tokenUsageStats.localDetections,
            aiCalls: tokenUsageStats.apiCalls,
            cacheHits: tokenUsageStats.cacheHits,
            tokensUsed: tokenUsageStats.tokensUsed,
            averageResponseTime: 0
          }
        });
        return;
      }

      const processedData = prepareAnalysisData(activeAssets);
      const detectedPatterns: HybridPattern[] = [];
      let aiCallsThisRound = 0;
      let localDetectionsThisRound = 0;
      let cacheHitsThisRound = 0;

      // Análise para cada asset
      for (const data of processedData) {
        const priority = calculatePriority(data);
        let pattern = null;
        let source: 'LOCAL' | 'AI' | 'CACHED' = 'LOCAL';

        // 1. Tentar detecção local primeiro
        if (priority === 'low' || priority === 'medium') {
          pattern = detectLocalPatterns(data);
          if (pattern) {
            localDetectionsThisRound++;
            source = 'LOCAL';
          }
        }

        // 2. Verificar cache se local não foi suficiente
        if (!pattern || pattern.confidence < 0.75) {
          const cachedPattern = getCachedAnalysis(data);
          if (cachedPattern) {
            pattern = cachedPattern;
            source = 'CACHED';
            cacheHitsThisRound++;
          }
        }

        // 3. Usar IA apenas para casos complexos ou alta prioridade
        if (!pattern && priority === 'high') {
          try {
            const aiResult = await callOptimizedAI(data);
            if (aiResult) {
              pattern = aiResult;
              source = 'AI';
              aiCallsThisRound++;
              
              // Adicionar ao cache
              setAnalysisCache(prev => {
                const newCache = new Map(prev);
                newCache.set(`${data.asset}-${Date.now()}`, {
                  data,
                  result: pattern!,
                  timestamp: Date.now()
                });
                return newCache;
              });
            }
          } catch (error) {
            console.error(`❌ Erro na análise IA para ${data.asset}:`, error);
            // Fallback para detecção local
            pattern = detectLocalPatterns(data);
            if (pattern) {
              localDetectionsThisRound++;
              source = 'LOCAL';
            }
          }
        }

        // Adicionar padrão detectado
        if (pattern && pattern.confidence > 0.5) {
          const hybridPattern: HybridPattern = {
            asset: data.asset,
            pattern: pattern.pattern,
            confidence: pattern.confidence,
            description: generateDescription(pattern, data),
            metrics: pattern.metrics,
            timeframe: '5min',
            severity: pattern.severity,
            nextProbableDirection: pattern.nextProbableDirection,
            reasoning: pattern.reasoning,
            source,
            alertType: mapPatternToAlertType(pattern.pattern)
          };

          detectedPatterns.push(hybridPattern);
        }
      }

      // Calcular estatísticas de mercado
      const marketSummary = calculateMarketSummary(detectedPatterns);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Atualizar estatísticas de performance
      setPerformanceStats(prev => ({
        localDetections: prev.localDetections + localDetectionsThisRound,
        aiCalls: prev.aiCalls + aiCallsThisRound,
        cacheHits: prev.cacheHits + cacheHitsThisRound,
        tokensUsed: prev.tokensUsed + (aiCallsThisRound * 25), // Estimativa
        totalAnalyses: prev.totalAnalyses + 1,
        averageResponseTime: (prev.averageResponseTime + responseTime) / 2
      }));

      setHybridAnalysis({
        detectedPatterns: detectedPatterns.sort((a, b) => b.confidence - a.confidence),
        marketSummary,
        performance: {
          localDetections: localDetectionsThisRound,
          aiCalls: aiCallsThisRound,
          cacheHits: cacheHitsThisRound,
          tokensUsed: aiCallsThisRound * 25,
          averageResponseTime: responseTime
        }
      });

      setLastAnalysis(Date.now());
      console.log(`✅ Análise híbrida concluída: ${detectedPatterns.length} padrões, ${localDetectionsThisRound} local, ${aiCallsThisRound} IA, ${cacheHitsThisRound} cache`);

    } catch (error) {
      console.error('❌ Erro na análise híbrida:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsAnalyzing(false);
    }
  }, [unifiedAssets, detectLocalPatterns, getCachedAnalysis, calculatePriority, tokenUsageStats, setAnalysisCache]);

  // Chamada otimizada para IA
  const callOptimizedAI = async (data: any) => {
    const { data: result, error } = await supabase.functions.invoke('analyze-liquidation-patterns', {
      body: {
        unifiedAssets: [data],
        timeWindowMinutes: 5
      }
    });

    if (error) throw error;
    
    const patterns = result?.detectedPatterns || [];
    if (patterns.length > 0) {
      return patterns[0]; // Retorna primeiro padrão
    }
    
    return null;
  };

  // Gerar descrição do padrão
  const generateDescription = (pattern: any, data: any): string => {
    const formatAmount = (amount: number) => `$${(amount / 1000).toFixed(0)}K`;
    
    switch (pattern.pattern) {
      case 'flip':
        return `LIQUIDATION FLIP: Após liquidações LONG pesadas, detectamos ${formatAmount(data.shorts)} em SHORT liquidations iniciando. Possível reversão bullish.`;
      case 'cascade':
        return `CASCATA DETECTADA: Liquidações acelerando ${(pattern.metrics.volumeSpike).toFixed(1)}x acima da média. Movimento em cadeia em progresso.`;
      case 'squeeze':
        return `SQUEEZE BILATERAL: LONGS ${formatAmount(data.longs)} + SHORTS ${formatAmount(data.shorts)} liquidados simultaneamente. Alta volatilidade.`;
      case 'vacuum':
        return `VÁCUO DE LIQUIDAÇÃO: ${formatAmount(data.longs + data.shorts)} liquidados com baixo volume de ordens. Movimento extremo provável.`;
      case 'hunt':
        return `HUNT & LIQUIDATE: Movimento rápido para liquidar posições, seguido de reversão. Padrão manipulativo detectado.`;
      default:
        return `Padrão ${pattern.pattern} detectado com ${(pattern.confidence * 100).toFixed(0)}% de confiança.`;
    }
  };

  // Mapear padrão para tipo de alerta
  const mapPatternToAlertType = (pattern: string): HybridPattern['alertType'] => {
    switch (pattern) {
      case 'flip': return 'iceberg';
      case 'cascade': return 'cascade';
      case 'squeeze': return 'squeeze';
      case 'hunt': return 'hunt';
      case 'vacuum': return 'vacuum';
      default: return 'general';
    }
  };

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
      recommendation = `Múltip<Pattern>los padrões de alta severidade. Monitorar posições de perto.`;
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
