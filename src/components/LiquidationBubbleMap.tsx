
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTrading } from '../contexts/TradingContext';
import { useUnifiedLiquidations } from '../hooks/useUnifiedLiquidations';
import { LiquidationHeader } from './liquidation/LiquidationHeader';
import { UnifiedLiquidationTable } from './liquidation/UnifiedLiquidationTable';
import { LiquidationStats } from './liquidation/LiquidationStats';

export const LiquidationBubbleMap: React.FC = () => {
  const { setSelectedAsset } = useTrading();
  const { longLiquidations, shortLiquidations } = useUnifiedLiquidations();

  const handleAssetClick = (asset: string) => {
    const fullTicker = asset.includes('USDT') ? asset : `${asset}USDT`;
    setSelectedAsset(fullTicker);
    console.log(`📈 Ativo selecionado: ${fullTicker}`);
  };

  return (
    <div className="h-full flex flex-col">
      <LiquidationHeader />

      <div className="flex-1 flex gap-4 p-4 min-h-0">
        <UnifiedLiquidationTable
          title="Long Liquidations"
          assets={longLiquidations}
          type="long"
          icon={TrendingDown}
          bgColor="bg-red-600"
          textColor="text-red-700"
          onAssetClick={handleAssetClick}
        />
        
        <UnifiedLiquidationTable
          title="Short Liquidations"
          assets={shortLiquidations}
          type="short"
          icon={TrendingUp}
          bgColor="bg-green-600"
          textColor="text-green-700"
          onAssetClick={handleAssetClick}
        />
      </div>

      <LiquidationStats
        longLiquidations={longLiquidations}
        shortLiquidations={shortLiquidations}
      />
    </div>
  );
};
