
import React from 'react';

interface LiquidationBubble {
  id: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  marketCap: 'high' | 'low';
  timestamp: Date;
  intensity: number;
  change24h: number;
  volume: number;
  lastUpdateTime: Date;
  totalLiquidated: number;
}

interface LiquidationStatsProps {
  longLiquidations: LiquidationBubble[];
  shortLiquidations: LiquidationBubble[];
}

export const LiquidationStats: React.FC<LiquidationStatsProps> = ({
  longLiquidations,
  shortLiquidations
}) => {
  const formatAmount = (amount: number) => {
    if (!amount || isNaN(amount)) return '$0.00';
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="p-3 border-t border-gray-200 bg-gray-50">
      <div className="flex justify-center space-x-8 text-sm">
        <div className="text-center">
          <div className="font-bold text-red-600">{longLiquidations.length}</div>
          <div className="text-gray-600">Long Liq</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-green-600">{shortLiquidations.length}</div>
          <div className="text-gray-600">Short Liq</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-gray-800">
            {formatAmount(
              [...longLiquidations, ...shortLiquidations]
                .reduce((total, liq) => total + liq.totalLiquidated, 0)
            )}
          </div>
          <div className="text-gray-600">Total Liquidated</div>
        </div>
      </div>
    </div>
  );
};
