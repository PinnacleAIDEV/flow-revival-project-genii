
import React, { useState } from 'react';
import { useLongLiquidations } from '../hooks/useLongLiquidations';
import { useShortLiquidations } from '../hooks/useShortLiquidations';
import { useTrading } from '../contexts/TradingContext';
import { useHybridTrendReversal } from '../hooks/useHybridTrendReversal';
import { useLiquidationPatternDetector } from '../hooks/useLiquidationPatternDetector';
import { HybridTrendReversalSection } from './liquidation/HybridTrendReversalSection';

// Interface específica para análise de reversão de tendência
interface TrendReversalAsset {
  asset: string;
  ticker: string;
  price: number;
  marketCap: 'high' | 'low';
  
  // Dados combinados para análise
  longPositions: number;
  longLiquidated: number;
  shortPositions: number;
  shortLiquidated: number;
  totalPositions: number;
  combinedTotal: number;
  dominantType: 'long' | 'short';
  
  // Dados temporais
  lastUpdateTime: Date;
  firstDetectionTime: Date;
  
  // Métricas de análise
  volatility: number;
  intensity: number;
  
  // Histórico combinado
  liquidationHistory: Array<{
    type: 'long' | 'short';
    amount: number;
    timestamp: Date;
    change24h: number;
  }>;
}

export const TrendReversalDetector: React.FC = () => {
  const { longLiquidations } = useLongLiquidations();
  const { shortLiquidations } = useShortLiquidations();
  const { setSelectedAsset } = useTrading();
  const [cardHeight, setCardHeight] = useState<1 | 2 | 3 | 4 | 5>(3);

  const handleAssetClick = (asset: string) => {
    const fullTicker = asset.includes('USDT') ? asset : `${asset}USDT`;
    setSelectedAsset(fullTicker);
    console.log(`🔄 Hybrid Trend Reversal selecionado: ${fullTicker}`);
  };

  // Criar Map unificado mantendo dados separados por tipo
  const unifiedAssetsMap = new Map<string, TrendReversalAsset>();
  
  // Processar long liquidations
  longLiquidations.forEach(asset => {
    const trendAsset: TrendReversalAsset = {
      asset: asset.asset,
      ticker: asset.ticker,
      price: asset.price,
      marketCap: asset.marketCap,
      longPositions: asset.longPositions,
      longLiquidated: asset.longLiquidated,
      shortPositions: 0,
      shortLiquidated: 0,
      totalPositions: asset.longPositions,
      combinedTotal: asset.longLiquidated,
      dominantType: 'long',
      lastUpdateTime: asset.lastUpdateTime,
      firstDetectionTime: asset.firstDetectionTime,
      volatility: asset.volatility,
      intensity: asset.intensity,
      liquidationHistory: asset.liquidationHistory
    };
    unifiedAssetsMap.set(asset.asset, trendAsset);
  });
  
  // Processar short liquidations e mesclar com long se necessário
  shortLiquidations.forEach(asset => {
    const existing = unifiedAssetsMap.get(asset.asset);
    if (existing) {
      // MESCLAR: Manter dados separados mas criar vista unificada
      const merged: TrendReversalAsset = {
        ...existing,
        // Adicionar dados SHORT
        shortPositions: asset.shortPositions,
        shortLiquidated: asset.shortLiquidated,
        // Recalcular totais
        totalPositions: existing.longPositions + asset.shortPositions,
        combinedTotal: existing.longLiquidated + asset.shortLiquidated,
        // Determinar tipo dominante baseado em valores separados
        dominantType: existing.longLiquidated > asset.shortLiquidated ? 'long' : 'short',
        // Mesclar histórico mantendo separação por tipo
        liquidationHistory: [...existing.liquidationHistory, ...asset.liquidationHistory],
        // Usar última atualização mais recente
        lastUpdateTime: existing.lastUpdateTime > asset.lastUpdateTime ? existing.lastUpdateTime : asset.lastUpdateTime
      };
      unifiedAssetsMap.set(asset.asset, merged);
    } else {
      // Adicionar asset que só tem SHORT liquidations
      const trendAsset: TrendReversalAsset = {
        asset: asset.asset,
        ticker: asset.ticker,
        price: asset.price,
        marketCap: asset.marketCap,
        longPositions: 0,
        longLiquidated: 0,
        shortPositions: asset.shortPositions,
        shortLiquidated: asset.shortLiquidated,
        totalPositions: asset.shortPositions,
        combinedTotal: asset.shortLiquidated,
        dominantType: 'short',
        lastUpdateTime: asset.lastUpdateTime,
        firstDetectionTime: asset.firstDetectionTime,
        volatility: asset.volatility,
        intensity: asset.intensity,
        liquidationHistory: asset.liquidationHistory
      };
      unifiedAssetsMap.set(asset.asset, trendAsset);
    }
  });

  // Usar o novo hook de detecção de padrões com análise de 5 em 5 minutos
  const {
    isAnalyzing: isPatternAnalyzing,
    analysisResult: patternAnalysis,
    analysisError: patternError,
    nextAnalysisIn,
    triggerManualAnalysis,
    hasData: hasPatternData
  } = useLiquidationPatternDetector(unifiedAssetsMap);

  // Usar o hook híbrido existente
  const {
    hybridAnalysis,
    isAnalyzing,
    analysisError,
    performanceStats,
    getIcebergAlerts,
    getCascadeAlerts,
    getSqueezeAlerts,
    getCriticalAlerts,
    hasData
  } = useHybridTrendReversal(unifiedAssetsMap);

  // Combinar análises - priorizar análise de padrões se disponível
  const finalAnalysis = patternAnalysis || hybridAnalysis;
  const finalIsAnalyzing = isPatternAnalyzing || isAnalyzing;
  const finalError = patternError || analysisError;

  // Controles de altura do card
  const getCardHeight = () => {
    switch (cardHeight) {
      case 1: return 'h-[300px]';
      case 2: return 'h-[600px]';
      case 3: return 'h-[900px]';
      case 4: return 'h-[1200px]';
      case 5: return 'h-[1500px]';
      default: return 'h-[900px]';
    }
  };

  return (
    <div className={`${getCardHeight()} scanlines relative`}>
      {/* Controles de altura */}
      <div className="absolute top-2 right-2 z-10 flex space-x-1">
        {[1, 2, 3, 4, 5].map((size) => (
          <button
            key={size}
            onClick={() => setCardHeight(size as 1 | 2 | 3 | 4 | 5)}
            className={`w-6 h-6 text-xs rounded border ${
              cardHeight === size
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
            }`}
          >
            {size}x
          </button>
        ))}
      </div>

      <HybridTrendReversalSection 
        hybridAnalysis={finalAnalysis}
        isAnalyzing={finalIsAnalyzing}
        analysisError={finalError}
        performanceStats={performanceStats}
        unifiedAssets={unifiedAssetsMap}
        onAssetClick={handleAssetClick}
        getIcebergAlerts={getIcebergAlerts}
        getCascadeAlerts={getCascadeAlerts}
        getSqueezeAlerts={getSqueezeAlerts}
        getCriticalAlerts={getCriticalAlerts}
        hasData={hasData || hasPatternData}
        nextAnalysisIn={nextAnalysisIn}
        triggerManualAnalysis={triggerManualAnalysis}
      />
    </div>
  );
};
