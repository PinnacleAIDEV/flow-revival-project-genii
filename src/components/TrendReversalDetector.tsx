
import React from 'react';
import { useSeparatedLiquidations } from '../hooks/useSeparatedLiquidations';
import { useTrading } from '../contexts/TradingContext';
import { AITrendReversalSection } from './liquidation/AITrendReversalSection';

export const TrendReversalDetector: React.FC = () => {
  const { longLiquidations, shortLiquidations } = useSeparatedLiquidations();
  const { setSelectedAsset } = useTrading();

  const handleAssetClick = (asset: string) => {
    const fullTicker = asset.includes('USDT') ? asset : `${asset}USDT`;
    setSelectedAsset(fullTicker);
    console.log(`🔄 AI Trend Reversal selecionado: ${fullTicker}`);
  };

  // Convert the arrays to a Map that AITrendReversalSection expects
  const unifiedAssetsMap = new Map();
  
  // Add long liquidations to the map
  longLiquidations.forEach(asset => {
    unifiedAssetsMap.set(asset.asset, asset);
  });
  
  // Add short liquidations to the map (or merge if asset already exists)
  shortLiquidations.forEach(asset => {
    const existing = unifiedAssetsMap.get(asset.asset);
    if (existing) {
      // Merge the data if the same asset exists in both long and short
      const merged = {
        ...existing,
        shortPositions: asset.shortPositions,
        shortLiquidated: asset.shortLiquidated,
        totalPositions: existing.longPositions + asset.shortPositions,
        combinedTotal: existing.longLiquidated + asset.shortLiquidated,
        dominantType: existing.longLiquidated > asset.shortLiquidated ? 'long' : 'short',
        liquidationHistory: [...existing.liquidationHistory, ...asset.liquidationHistory]
      };
      unifiedAssetsMap.set(asset.asset, merged);
    } else {
      unifiedAssetsMap.set(asset.asset, asset);
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
