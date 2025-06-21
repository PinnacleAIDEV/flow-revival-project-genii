
import React from 'react';
import { useLongLiquidations } from '../hooks/useLongLiquidations';
import { useShortLiquidations } from '../hooks/useShortLiquidations';
import { useTrading } from '../contexts/TradingContext';
import { AITrendReversalSection } from './liquidation/AITrendReversalSection';
import { UnifiedLiquidationAsset } from '../types/liquidation';

export const TrendReversalDetector: React.FC = () => {
  const { longLiquidations } = useLongLiquidations();
  const { shortLiquidations } = useShortLiquidations();
  const { setSelectedAsset } = useTrading();

  const handleAssetClick = (asset: string) => {
    const fullTicker = asset.includes('USDT') ? asset : `${asset}USDT`;
    setSelectedAsset(fullTicker);
    console.log(`🔄 AI Trend Reversal selecionado: ${fullTicker}`);
  };

  // CORRIGIDO: Criar Map unificado mantendo dados separados por tipo
  const unifiedAssetsMap = new Map<string, UnifiedLiquidationAsset>();
  
  // Processar long liquidations
  longLiquidations.forEach(asset => {
    unifiedAssetsMap.set(asset.asset, asset);
  });
  
  // Processar short liquidations e mesclar com long se necessário
  shortLiquidations.forEach(asset => {
    const existing = unifiedAssetsMap.get(asset.asset);
    if (existing) {
      // MESCLAR: Manter dados separados mas criar vista unificada
      const merged: UnifiedLiquidationAsset = {
        ...existing,
        // Manter dados SHORT do novo asset
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
      unifiedAssetsMap.set(asset.asset, {
        ...asset,
        // Garantir que campos LONG sejam zero
        longPositions: 0,
        longLiquidated: 0,
        totalPositions: asset.shortPositions,
        combinedTotal: asset.shortLiquidated,
        dominantType: 'short'
      });
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
