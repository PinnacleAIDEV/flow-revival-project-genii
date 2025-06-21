
import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Activity } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { UnifiedLiquidationAsset } from '../../types/liquidation';

interface UnifiedLiquidationRowProps {
  asset: UnifiedLiquidationAsset;
  type: 'long' | 'short';
  onAssetClick: (asset: string) => void;
}

export const UnifiedLiquidationRow: React.FC<UnifiedLiquidationRowProps> = ({
  asset,
  type,
  onAssetClick
}) => {
  // CORRIGIDO: Usar apenas valores do tipo específico
  const positions = type === 'long' ? asset.longPositions : asset.shortPositions;
  const liquidated = type === 'long' ? asset.longLiquidated : asset.shortLiquidated;
  
  const formatAmount = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 5) return 'bg-red-500 text-white';
    if (intensity >= 4) return 'bg-orange-500 text-white';
    if (intensity >= 3) return 'bg-yellow-500 text-white';
    return 'bg-gray-400 text-white';
  };

  const getMarketCapColor = (marketCap: string) => {
    return marketCap === 'high' 
      ? 'bg-blue-500 text-white' 
      : 'bg-purple-500 text-white';
  };

  const themeColors = type === 'long' 
    ? {
        border: 'border-l-red-500 hover:border-l-red-600',
        icon: 'text-red-600',
        iconBg: 'bg-red-100',
        text: 'text-red-600',
        accent: 'text-red-500'
      }
    : {
        border: 'border-l-green-500 hover:border-l-green-600',
        icon: 'text-green-600',
        iconBg: 'bg-green-100',
        text: 'text-green-600',
        accent: 'text-green-500'
      };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4 ${themeColors.border} bg-white hover:bg-gray-50`}
      onClick={() => onAssetClick(asset.asset)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${themeColors.iconBg}`}>
              {type === 'long' ? (
                <TrendingDown className={`w-5 h-5 ${themeColors.icon}`} />
              ) : (
                <TrendingUp className={`w-5 h-5 ${themeColors.icon}`} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900">{asset.asset}</h3>
              <p className="text-sm text-gray-500 font-mono">{asset.ticker}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getMarketCapColor(asset.marketCap)}>
              {asset.marketCap.toUpperCase()}
            </Badge>
            <Badge className={getIntensityColor(asset.intensity)}>
              {asset.intensity}/5
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Preço</div>
            <div className="font-bold text-gray-900">{formatPrice(asset.price)}</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Posições</div>
            <div className={`font-bold ${themeColors.text}`}>
              {positions}
            </div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Liquidado</div>
            <div className={`font-bold ${themeColors.text}`}>
              {formatAmount(liquidated)}
            </div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Volatilidade</div>
            <div className="font-bold text-orange-600 flex items-center justify-center">
              <Activity className="w-3 h-3 mr-1" />
              {asset.volatility.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
