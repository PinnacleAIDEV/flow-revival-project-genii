
import { useState, useEffect } from 'react';
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

interface AIPattern {
  asset: string;
  pattern: string;
  confidence: number;
  description: string;
  metrics: {
    liquidationVelocity: number;
    lsRatio: number;
    cascadeProbability: number;
  };
  timeframe: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  nextProbableDirection: 'LONG_LIQUIDATIONS' | 'SHORT_LIQUIDATIONS' | 'BALANCED';
  reasoning: string;
}

interface AIAnalysis {
  detectedPatterns: AIPattern[];
  marketSummary: {
    dominantPattern: string;
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendation: string;
  };
}

export const useAITrendReversal = (unifiedAssets: Map<string, TrendReversalAsset>) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<number>(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Análise automática a cada 15 segundos para ser mais responsiva
  useEffect(() => {
    const now = Date.now();
    const shouldAnalyze = unifiedAssets.size > 0 && (now - lastAnalysis > 15000); // 15 segundos
    
    if (shouldAnalyze && !isAnalyzing) {
      analyzePatterns();
    }
  }, [unifiedAssets, lastAnalysis, isAnalyzing]);

  const analyzePatterns = async () => {
    if (unifiedAssets.size === 0) {
      console.log('🤖 Nenhum asset para análise de IA');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      console.log('🤖 Iniciando análise de IA para padrões de liquidação...');
      
      // Converter Map para Array
      const assetsArray = Array.from(unifiedAssets.values());
      
      // Filtrar apenas assets com atividade recente (últimos 5 min para ser mais responsivo)
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const activeAssets = assetsArray.filter(asset => {
        const lastUpdate = new Date(asset.lastUpdateTime);
        const hasRecentActivity = lastUpdate > fiveMinutesAgo;
        const hasMinimumHistory = asset.liquidationHistory.length >= 2;
        
        return hasRecentActivity && hasMinimumHistory;
      });

      if (activeAssets.length === 0) {
        console.log('📊 Nenhum ativo com atividade recente suficiente para análise');
        setAiAnalysis({
          detectedPatterns: [],
          marketSummary: {
            dominantPattern: "NO_ACTIVITY",
            overallRisk: "LOW",
            recommendation: "Aguardando atividade de liquidação para análise"
          }
        });
        setLastAnalysis(Date.now());
        return;
      }

      console.log(`🔍 Analisando ${activeAssets.length} ativos ativos para padrões de IA...`);

      const { data, error } = await supabase.functions.invoke('analyze-liquidation-patterns', {
        body: {
          unifiedAssets: activeAssets,
          timeWindowMinutes: 5 // Janela menor para detecção mais rápida
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!data) {
        throw new Error('Nenhum dado retornado da função de análise');
      }

      const analysis: AIAnalysis = data;
      
      console.log(`✨ IA detectou ${analysis.detectedPatterns.length} padrões:`);
      analysis.detectedPatterns.forEach(pattern => {
        console.log(`   🎯 ${pattern.asset}: ${pattern.pattern} (${pattern.confidence}% confiança) - ${pattern.severity}`);
      });

      setAiAnalysis(analysis);
      setLastAnalysis(Date.now());

    } catch (error) {
      console.error('❌ Erro na análise de IA:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setAnalysisError(errorMessage);
      
      // Manter análise anterior em caso de erro, mas registrar o problema
      if (!aiAnalysis) {
        setAiAnalysis({
          detectedPatterns: [],
          marketSummary: {
            dominantPattern: "ERROR",
            overallRisk: "LOW",
            recommendation: `Erro na análise: ${errorMessage}`
          }
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Função para forçar nova análise
  const forceAnalysis = () => {
    console.log('🔄 Forçando nova análise de IA...');
    setLastAnalysis(0);
    analyzePatterns();
  };

  // Filtrar padrões por severidade
  const getPatternsBySeverity = (severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    return aiAnalysis?.detectedPatterns.filter(p => p.severity === severity) || [];
  };

  // Obter padrões de Liquidation Flip (nosso "iceberg")
  const getLiquidationFlips = () => {
    return aiAnalysis?.detectedPatterns.filter(p => 
      p.pattern.toLowerCase().includes('flip') || 
      p.pattern.toLowerCase().includes('reversal') ||
      p.pattern.toLowerCase().includes('iceberg')
    ) || [];
  };

  // Obter métricas agregadas
  const getAggregatedMetrics = () => {
    if (!aiAnalysis?.detectedPatterns.length) return null;

    const patterns = aiAnalysis.detectedPatterns;
    return {
      avgConfidence: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length,
      avgLiquidationVelocity: patterns.reduce((sum, p) => sum + p.metrics.liquidationVelocity, 0) / patterns.length,
      avgCascadeProbability: patterns.reduce((sum, p) => sum + p.metrics.cascadeProbability, 0) / patterns.length,
      highSeverityCount: patterns.filter(p => p.severity === 'HIGH' || p.severity === 'CRITICAL').length,
      dominantDirection: getMostCommonDirection(patterns),
      totalPatterns: patterns.length
    };
  };

  const getMostCommonDirection = (patterns: AIPattern[]) => {
    const directions = patterns.map(p => p.nextProbableDirection);
    const longCount = directions.filter(d => d === 'LONG_LIQUIDATIONS').length;
    const shortCount = directions.filter(d => d === 'SHORT_LIQUIDATIONS').length;
    
    if (longCount > shortCount) return 'LONG_LIQUIDATIONS';
    if (shortCount > longCount) return 'SHORT_LIQUIDATIONS';
    return 'BALANCED';
  };

  return {
    aiAnalysis,
    isAnalyzing,
    analysisError,
    analyzePatterns: forceAnalysis,
    getPatternsBySeverity,
    getLiquidationFlips,
    getAggregatedMetrics,
    lastAnalyzed: new Date(lastAnalysis),
    hasData: (aiAnalysis?.detectedPatterns.length || 0) > 0
  };
};
