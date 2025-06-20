
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTrading } from '../contexts/TradingContext';
import { useLiquidationData } from '../hooks/useLiquidationData';
import { use24hLiquidationData } from '../hooks/use24hLiquidationData';
import { LiquidationHeader } from './liquidation/LiquidationHeader';
import { LiquidationTable } from './liquidation/LiquidationTable';
import { LiquidationStats } from './liquidation/LiquidationStats';
import { DailyTotalSection } from './liquidation/DailyTotalSection';

export const LiquidationBubbleMap: React.FC = () => {
  const { setSelectedAsset } = useTrading();
  const { longLiquidations, shortLiquidations } = useLiquidationData();
  const { dailyTotals, stats: dailyStats, timeUntilReset, lastUpdateTime } = use24hLiquidationData();

  const handleAssetClick = (asset: string) => {
    const fullTicker = asset.includes('USDT') ? asset : `${asset}USDT`;
    setSelectedAsset(fullTicker);
    console.log(`📈 Ativo selecionado: ${fullTicker}`);
  };

  return (
    <div className="h-full flex flex-col">
      <LiquidationHeader />

      <div className="flex-1 flex gap-4 p-4 min-h-0">
        <LiquidationTable
          title="Long Liquidations"
          liquidations={longLiquidations}
          icon={TrendingDown}
          bgColor="bg-red-600"
          textColor="text-red-700"
          onAssetClick={handleAssetClick}
        />
        
        <LiquidationTable
          title="Short Liquidations"
          liquidations={shortLiquidations}
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

      {/* NOVA SEÇÃO: Totais 24h */}
      <DailyTotalSection
        dailyTotals={dailyTotals}
        stats={dailyStats}
        timeUntilReset={timeUntilReset}
        lastUpdateTime={lastUpdateTime}
        onAssetClick={handleAssetClick}
      />
    </div>
  );
};
