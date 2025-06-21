
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTrading } from '../contexts/TradingContext';
import { useLongLiquidations } from '../hooks/useLongLiquidations';
import { useShortLiquidations } from '../hooks/useShortLiquidations';
import { LiquidationHeader } from './liquidation/LiquidationHeader';
import { LongLiquidationTable } from './liquidation/LongLiquidationTable';
import { ShortLiquidationTable } from './liquidation/ShortLiquidationTable';
import { LiquidationStats } from './liquidation/LiquidationStats';

export const LiquidationBubbleMap: React.FC = () => {
  const { setSelectedAsset } = useTrading();
  const { longLiquidations } = useLongLiquidations();
  const { shortLiquidations } = useShortLiquidations();

  const handleAssetClick = (asset: string) => {
    const fullTicker = asset.includes('USDT') ? asset : `${asset}USDT`;
    setSelectedAsset(fullTicker);
    console.log(`📈 Ativo selecionado: ${fullTicker}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LiquidationHeader />

      <div className="flex-1 flex gap-4 p-4 min-h-[800px]">
        <LongLiquidationTable
          title="Long Liquidations"
          assets={longLiquidations}
          icon={TrendingDown}
          bgColor="bg-red-600"
          textColor="text-red-700"
          onAssetClick={handleAssetClick}
        />
        
        <ShortLiquidationTable
          title="Short Liquidations"
          assets={shortLiquidations}
          icon={TrendingUp}
          bgColor="bg-green-600"
          textColor="text-green-700"
          onAssetClick={handleAssetClick}
        />
      </div>

      <LiquidationStats />
    </div>
  );
};
