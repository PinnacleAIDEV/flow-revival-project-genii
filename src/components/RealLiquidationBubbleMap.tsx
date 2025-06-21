
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTrading } from '../contexts/TradingContext';
import { useRealSeparatedLiquidations } from '../hooks/useRealSeparatedLiquidations';
import { LiquidationHeader } from './liquidation/LiquidationHeader';
import { LongLiquidationTable } from './liquidation/LongLiquidationTable';
import { ShortLiquidationTable } from './liquidation/ShortLiquidationTable';
import { RealLiquidationStats } from './liquidation/RealLiquidationStats';

export const RealLiquidationBubbleMap: React.FC = () => {
  const { setSelectedAsset } = useTrading();
  const { longLiquidations, shortLiquidations } = useRealSeparatedLiquidations();

  const handleAssetClick = (asset: string) => {
    const fullTicker = asset.includes('USDT') ? asset : `${asset}USDT`;
    setSelectedAsset(fullTicker);
    console.log(`📈 REAL Asset selected: ${fullTicker}`);
  };

  console.log(`🔴 REAL Long Liquidations in BubbleMap: ${longLiquidations.length}`);
  console.log(`🟢 REAL Short Liquidations in BubbleMap: ${shortLiquidations.length}`);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <LiquidationHeader />

      <div className="flex-1 flex gap-4 p-4 min-h-[800px]">
        <LongLiquidationTable
          title="REAL Long Liquidations"
          assets={longLiquidations}
          icon={TrendingDown}
          bgColor="bg-red-600"
          textColor="text-red-700"
          onAssetClick={handleAssetClick}
        />
        
        <ShortLiquidationTable
          title="REAL Short Liquidations"
          assets={shortLiquidations}
          icon={TrendingUp}
          bgColor="bg-green-600"
          textColor="text-green-700"
          onAssetClick={handleAssetClick}
        />
      </div>

      <RealLiquidationStats />
    </div>
  );
};
