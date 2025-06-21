
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../integrations/supabase/client';

interface LiquidationData {
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

interface PatternAnalysis {
  detectedPatterns: Array<{
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
  }>;
  marketSummary: {
    dominantPattern: string;
    overallRisk: string;
    recommendation: string;
    confidence: number;
  };
}

export const useLiquidationPatternDetector = (unifiedAssets: Map<string, any>) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PatternAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<PatternAnalysis[]>([]);
  const [nextAnalysisIn, setNextAnalysisIn] = useState<number>(0);
  
  const lastAnalysisRef = useRef<Date | null>(null);
  const isFirstAnalysisRef = useRef(true);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Preparar dados para análise
  const prepareDataForAnalysis = (): LiquidationData[] => {
    const unifiedData: LiquidationData[] = [];
    
    unifiedAssets.forEach((asset, key) => {
      const longLiquidated = asset.longLiquidated || 0;
      const shortLiquidated = asset.shortLiquidated || 0;
      const totalLiquidated = longLiquidated + shortLiquidated;
      
      if (totalLiquidated > 0) {
        const ratio = shortLiquidated > 0 ? longLiquidated / shortLiquidated : longLiquidated;
        const velocity = totalLiquidated / 60000; // liquidações por segundo
        
        unifiedData.push({
          asset: asset.asset,
          longs: longLiquidated,
          shorts: shortLiquidated,
          velocity: velocity,
          ratio: ratio,
          volume: asset.volume || totalLiquidated,
          price: asset.price,
          avgLongs: longLiquidated,
          avgShorts: shortLiquidated,
          avgVelocity: velocity,
          avgVolume: totalLiquidated,
          longHistory: [longLiquidated],
          shortHistory: [shortLiquidated],
          timestamp: new Date().toISOString(),
          previousVelocity: 0,
          acceleration: 0
        });
      }
    });
    
    return unifiedData.sort((a, b) => (b.longs + b.shorts) - (a.longs + a.shorts)).slice(0, 15);
  };

  // Função para executar análise
  const performAnalysis = async () => {
    if (isAnalyzing) return;
    
    const dataForAnalysis = prepareDataForAnalysis();
    
    if (dataForAnalysis.length === 0) {
      console.log('🤖 Nenhum dado disponível para análise de padrões');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    
    const currentTime = new Date();
    const analysisType = isFirstAnalysisRef.current ? 'INICIAL' : '5MIN-INTERVAL';
    
    console.log(`🤖 [${analysisType}] Iniciando análise de padrões com ${dataForAnalysis.length} ativos...`);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-liquidation-patterns', {
        body: {
          unifiedAssets: dataForAnalysis,
          timeWindowMinutes: isFirstAnalysisRef.current ? 1 : 5
        }
      });

      if (error) {
        throw error;
      }

      console.log(`✅ [${analysisType}] Análise concluída:`, data);
      
      setAnalysisResult(data);
      setAnalysisHistory(prev => [...prev.slice(-9), data]); // Manter últimas 10 análises
      lastAnalysisRef.current = currentTime;
      
      if (isFirstAnalysisRef.current) {
        isFirstAnalysisRef.current = false;
        console.log('🎯 Primeira análise concluída. Próximas análises serão de 5 em 5 minutos.');
      }

    } catch (error) {
      console.error(`❌ [${analysisType}] Erro na análise:`, error);
      setAnalysisError(error instanceof Error ? error.message : 'Erro desconhecido na análise');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Agendar próxima análise
  const scheduleNextAnalysis = () => {
    if (analysisIntervalRef.current) {
      clearTimeout(analysisIntervalRef.current);
    }

    const delay = isFirstAnalysisRef.current ? 2000 : 5 * 60 * 1000; // 2s para primeira, 5min para demais
    
    analysisIntervalRef.current = setTimeout(() => {
      performAnalysis();
    }, delay);

    // Iniciar countdown
    let countdown = Math.floor(delay / 1000);
    setNextAnalysisIn(countdown);
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    countdownIntervalRef.current = setInterval(() => {
      countdown -= 1;
      setNextAnalysisIn(countdown);
      
      if (countdown <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      }
    }, 1000);
  };

  // Efeito principal
  useEffect(() => {
    if (unifiedAssets.size > 0) {
      scheduleNextAnalysis();
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearTimeout(analysisIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [unifiedAssets.size]);

  // Força nova análise manualmente
  const triggerManualAnalysis = () => {
    performAnalysis();
  };

  return {
    isAnalyzing,
    analysisResult,
    analysisError,
    analysisHistory,
    nextAnalysisIn,
    triggerManualAnalysis,
    hasData: unifiedAssets.size > 0
  };
};
