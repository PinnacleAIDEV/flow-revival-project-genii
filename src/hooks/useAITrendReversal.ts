
import { useState, useEffect } from 'react';
import { UnifiedLiquidationAsset } from '../types/liquidation';
import { useSupabase } from '@/integrations/supabase/client';

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

export const useAITrendReversal = (unifiedAssets: Map<string, UnifiedLiquidationAsset>) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<number>(0);
  const supabase = useSupabase();

  // Análise automática a cada 30 segundos se houver mudanças
  useEffect(() => {
    const now = Date.now();
    const shouldAnalyze = unifiedAssets.size > 0 && (now - lastAnalysis > 30000); // 30 segundos
    
    if (shouldAnalyze && !isAnalyzing) {
      analyzePatterns();
    }
  }, [unifiedAssets, lastAnalysis, isAnalyzing]);

  const analyzePatterns = async () => {
    if (unifiedAssets.size === 0) return;

    setIsAnalyzing(true);
    try {
      console.log('🤖 Iniciando análise de IA para padrões de liquidação...');
      
      // Converter Map para Array
      const assetsArray = Array.from(unifiedAssets.values());
      
      // Filtrar apenas assets com atividade recente (últimos 10 min)
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const activeAssets = assetsArray.filter(asset => 
        new Date(asset.lastUpdateTime) > tenMinutesAgo &&
        asset.liquidationHistory.length >= 2 // Mínimo de histórico
      );

      if (activeAssets.length === 0) {
        console.log('📊 Nenhum ativo com atividade suficiente para análise');
        return;
      }

      console.log(`🔍 Analisando ${activeAssets.length} ativos ativos...`);

      const { data, error } = await supabase.functions.invoke('analyze-liquidation-patterns', {
        body: {
          unifiedAssets: activeAssets,
          timeWindowMinutes: 10
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const analysis: AIAnalysis = data;
      
      console.log(`✨ IA detectou ${analysis.detectedPatterns.length} padrões:`);
      analysis.detectedPatterns.forEach(pattern => {
        console.log(`   🎯 ${pattern.asset}: ${pattern.pattern} (${pattern.confidence}% confiança)`);
      });

      setAiAnalysis(analysis);
      setLastAnalysis(Date.now());

    } catch (error) {
      console.error('❌ Erro na análise de IA:', error);
      // Manter análise anterior em caso de erro
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Função para forçar nova análise
  const forceAnalysis = () => {
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
      p.pattern.toLowerCase().includes('reversal')
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
      dominantDirection: getMostCommonDirection(patterns)
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
    analyzePatterns: forceAnalysis,
    getPatternsBySeverity,
    getLiquidationFlips,
    getAggregatedMetrics,
    lastAnalyzed: new Date(lastAnalysis)
  };
};
