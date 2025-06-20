
import React from 'react';
import { useLiquidationData } from '../hooks/useLiquidationData';
import { useTrading } from '../contexts/TradingContext';
import { TrendReversalSection } from './liquidation/TrendReversalSection';

export const TrendReversalDetector: React.FC = () => {
  const { longLiquidations, shortLiquidations } = useLiquidationData();
  const { setSelectedAsset } = useTrading();

  const handleAssetClick = (asset: string) => {
    const fullTicker = asset.includes('USDT') ? asset : `${asset}USDT`;
    setSelectedAsset(fullTicker);
    console.log(`🔄 Trend Reversal selecionado: ${fullTicker}`);
  };

  return (
    <div className="h-[500px] scanlines">
      <TrendReversalSection 
        longLiquidations={longLiquidations}
        shortLiquidations={shortLiquidations}
        onAssetClick={handleAssetClick}
      />
    </div>
  );
};
