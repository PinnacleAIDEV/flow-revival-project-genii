
import React from 'react';
import { useLongLiquidations } from '../hooks/useLongLiquidations';
import { useShortLiquidations } from '../hooks/useShortLiquidations';
import { useTrading } from '../contexts/TradingContext';
import { AITrendReversalSection } from './liquidation/AITrendReversalSection';
import { LongLiquidationAsset, ShortLiquidationAsset } from '../types/separatedLiquidation';

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

  const handleAssetClick = (asset: string) => {
    const fullTicker = asset.includes('USDT') ? asset : `${asset}USDT`;
    setSelectedAsset(fullTicker);
    console.log(`🔄 AI Trend Reversal selecionado: ${fullTicker}`);
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

  return (
    <div className="h-[600px] scanlines">
      <AITrendReversalSection 
        unifiedAssets={unifiedAssetsMap}
        onAssetClick={handleAssetClick}
      />
    </div>
  );
};
