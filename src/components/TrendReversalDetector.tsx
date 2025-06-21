
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

  // Create a combined array for the AI section that expects unifiedAssets
  const combinedAssets = [...longLiquidations, ...shortLiquidations];

  return (
    <div className="h-[600px] scanlines">
      <AITrendReversalSection 
        unifiedAssets={combinedAssets}
        onAssetClick={handleAssetClick}
      />
    </div>
  );
};
