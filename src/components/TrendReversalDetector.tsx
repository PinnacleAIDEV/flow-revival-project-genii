
import React from 'react';
import { useUnifiedLiquidations } from '../hooks/useUnifiedLiquidations';
import { useTrading } from '../contexts/TradingContext';
import { AITrendReversalSection } from './liquidation/AITrendReversalSection';

export const TrendReversalDetector: React.FC = () => {
  const { unifiedAssets } = useUnifiedLiquidations();
  const { setSelectedAsset } = useTrading();

  const handleAssetClick = (asset: string) => {
    const fullTicker = asset.includes('USDT') ? asset : `${asset}USDT`;
    setSelectedAsset(fullTicker);
    console.log(`🔄 AI Trend Reversal selecionado: ${fullTicker}`);
  };

  return (
    <div className="h-[600px] scanlines">
      <AITrendReversalSection 
        unifiedAssets={unifiedAssets}
        onAssetClick={handleAssetClick}
      />
    </div>
  );
};
