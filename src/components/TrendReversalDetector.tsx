
import React from 'react';
import { useUnifiedLiquidations } from '../hooks/useUnifiedLiquidations';
import { useTrading } from '../contexts/TradingContext';
import { EnhancedTrendReversalSection } from './liquidation/EnhancedTrendReversalSection';

export const TrendReversalDetector: React.FC = () => {
  const { trendReversals } = useUnifiedLiquidations();
  const { setSelectedAsset } = useTrading();

  const handleAssetClick = (asset: string) => {
    const fullTicker = asset.includes('USDT') ? asset : `${asset}USDT`;
    setSelectedAsset(fullTicker);
    console.log(`🔄 Trend Reversal selecionado: ${fullTicker}`);
  };

  return (
    <div className="h-[500px] scanlines">
      <EnhancedTrendReversalSection 
        trendReversals={trendReversals}
        onAssetClick={handleAssetClick}
      />
    </div>
  );
};
