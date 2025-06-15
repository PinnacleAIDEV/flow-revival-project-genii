
import React from 'react';
import { TableCell, TableRow } from '../ui/table';

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

interface LiquidationRowProps {
  liquidation: LiquidationBubble;
  index: number;
  textColor: string;
  onAssetClick: (asset: string) => void;
}

export const LiquidationRow: React.FC<LiquidationRowProps> = ({
  liquidation,
  index,
  textColor,
  onAssetClick
}) => {
  const formatAmount = (amount: number) => {
    if (!amount || isNaN(amount)) return '$0.00';
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '$0.00';
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatChange = (change: number) => {
    if (change === undefined || change === null || isNaN(change)) return '0.00%';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getIntensityColor = (intensity: number) => {
    const colors = {
      1: 'bg-gray-100 text-gray-700',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-orange-100 text-orange-800',
      4: 'bg-red-100 text-red-800',
      5: 'bg-red-200 text-red-900'
    };
    return colors[intensity as keyof typeof colors] || colors[1];
  };

  return (
    <TableRow className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
      <TableCell className="font-bold">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${liquidation.type === 'long' ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <button
            onClick={() => onAssetClick(liquidation.asset)}
            className={`${textColor} hover:underline cursor-pointer font-bold text-sm`}
          >
            {liquidation.asset}
          </button>
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs">
        {formatPrice(liquidation.price)}
      </TableCell>
      <TableCell>
        <span className={`font-semibold text-xs ${liquidation.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatChange(liquidation.change24h)}
        </span>
      </TableCell>
      <TableCell className="font-mono text-xs font-bold">
        {formatAmount(liquidation.totalLiquidated)}
      </TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          liquidation.marketCap === 'high' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {liquidation.marketCap === 'high' ? 'HIGH' : 'LOW'}
        </span>
      </TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded text-xs font-bold ${getIntensityColor(liquidation.intensity)}`}>
          {liquidation.intensity}
        </span>
      </TableCell>
    </TableRow>
  );
};
