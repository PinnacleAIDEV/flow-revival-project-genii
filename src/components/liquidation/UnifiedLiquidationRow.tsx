
import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
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
    if (intensity >= 5) return 'bg-red-100 text-red-800';
    if (intensity >= 4) return 'bg-orange-100 text-orange-800';
    if (intensity >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-700';
  };

  const getMarketCapColor = (marketCap: string) => {
    return marketCap === 'high' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800';
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${
        type === 'long' ? 'border-l-red-500 hover:border-l-red-600' : 'border-l-green-500 hover:border-l-green-600'
      }`}
      onClick={() => onAssetClick(asset.asset)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-1 rounded ${type === 'long' ? 'bg-red-100' : 'bg-green-100'}`}>
              {type === 'long' ? (
                <TrendingDown className="w-4 h-4 text-red-600" />
              ) : (
                <TrendingUp className="w-4 h-4 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{asset.asset}</h3>
              <p className="text-sm text-gray-500 font-mono">{asset.ticker}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getMarketCapColor(asset.marketCap)}>
              {asset.marketCap.toUpperCase()} CAP
            </Badge>
            <Badge className={getIntensityColor(asset.intensity)}>
              Risk {asset.intensity}/5
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-gray-500">Preço</div>
            <div className="font-bold text-gray-900">{formatPrice(asset.price)}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-500">Posições {type}</div>
            <div className={`font-bold ${type === 'long' ? 'text-red-600' : 'text-green-600'}`}>
              {positions}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-500">Liquidado</div>
            <div className={`font-bold ${type === 'long' ? 'text-red-600' : 'text-green-600'}`}>
              {formatAmount(liquidated)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-500">Volatilidade</div>
            <div className="font-bold text-orange-600">
              {asset.volatility.toFixed(1)}%
            </div>
          </div>
        </div>

        {asset.intensity >= 4 && (
          <div className="mt-3 p-2 bg-red-50 rounded-md border border-red-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">
                Alta intensidade de liquidação detectada
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
