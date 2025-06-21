
import React from 'react';
import { TrendingUp, TrendingDown, Clock, Target } from 'lucide-react';
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
    if (intensity >= 5) return 'bg-red-100 text-red-800 border-red-200';
    if (intensity >= 4) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (intensity >= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getMarketCapColor = (marketCap: string) => {
    return marketCap === 'high' 
      ? 'bg-blue-100 text-blue-800 border-blue-200' 
      : 'bg-purple-100 text-purple-800 border-purple-200';
  };

  const getVolatilityColor = (volatility: number) => {
    if (volatility >= 15) return 'text-red-600 bg-red-50';
    if (volatility >= 10) return 'text-orange-600 bg-orange-50';
    if (volatility >= 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getLiquidationPressure = (intensity: number) => {
    if (intensity >= 5) return { text: 'EXTREMA', color: 'text-red-700' };
    if (intensity >= 4) return { text: 'ALTA', color: 'text-orange-700' };
    if (intensity >= 3) return { text: 'MODERADA', color: 'text-yellow-700' };
    return { text: 'BAIXA', color: 'text-gray-600' };
  };

  const pressure = getLiquidationPressure(asset.intensity);

  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-l-4 ${
        type === 'long' 
          ? 'border-l-red-500 hover:border-l-red-600 bg-gradient-to-br from-red-50/30 to-white' 
          : 'border-l-green-500 hover:border-l-green-600 bg-gradient-to-br from-green-50/30 to-white'
      }`}
      onClick={() => onAssetClick(asset.asset)}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg shadow-sm ${
              type === 'long' 
                ? 'bg-gradient-to-br from-red-100 to-red-200' 
                : 'bg-gradient-to-br from-green-100 to-green-200'
            }`}>
              {type === 'long' ? (
                <TrendingDown className="w-5 h-5 text-red-700" />
              ) : (
                <TrendingUp className="w-5 h-5 text-green-700" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900 tracking-tight">{asset.asset}</h3>
              <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-md inline-block">
                {asset.ticker}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={`${getMarketCapColor(asset.marketCap)} font-bold border`}>
              {asset.marketCap.toUpperCase()} CAP
            </Badge>
            <Badge className={`${getIntensityColor(asset.intensity)} font-bold border`}>
              Risk {asset.intensity}/5
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="w-4 h-4 text-gray-600" />
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Preço Atual</div>
            </div>
            <div className="font-bold text-lg text-gray-900">{formatPrice(asset.price)}</div>
          </div>
          
          <div className={`p-3 rounded-lg border ${
            type === 'long' ? 'bg-red-50' : 'bg-green-50'
          }`}>
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
              Posições {type}
            </div>
            <div className={`font-bold text-lg ${
              type === 'long' ? 'text-red-700' : 'text-green-700'
            }`}>
              {positions.toLocaleString()}
            </div>
          </div>
          
          <div className={`p-3 rounded-lg border ${
            type === 'long' ? 'bg-red-50' : 'bg-green-50'
          }`}>
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
              Liquidado
            </div>
            <div className={`font-bold text-lg ${
              type === 'long' ? 'text-red-700' : 'text-green-700'
            }`}>
              {formatAmount(liquidated)}
            </div>
          </div>
          
          <div className={`p-3 rounded-lg border ${getVolatilityColor(asset.volatility)}`}>
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
              Volatilidade
            </div>
            <div className="font-bold text-lg">
              {asset.volatility.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 font-medium">
                Pressão de Liquidação: <span className={`font-bold ${pressure.color}`}>{pressure.text}</span>
              </span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Clique para analisar
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
