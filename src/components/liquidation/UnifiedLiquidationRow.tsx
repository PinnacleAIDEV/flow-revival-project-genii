
import React from 'react';
import { TrendingDown, TrendingUp, Clock, Target, Zap } from 'lucide-react';
import { Badge } from '../ui/badge';
import { UnifiedLiquidationAsset } from '../../types/liquidation';
import { formatAmount } from '../../utils/liquidationUtils';

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
  const isLong = type === 'long';
  const relevantAmount = isLong ? asset.longLiquidated : asset.shortLiquidated;
  const relevantPositions = isLong ? asset.longPositions : asset.shortPositions;
  
  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    return `${Math.floor(diffInSeconds / 3600)}h`;
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 5) return 'bg-red-600 text-white';
    if (intensity >= 4) return 'bg-red-500 text-white';
    if (intensity >= 3) return 'bg-orange-500 text-white';
    if (intensity >= 2) return 'bg-yellow-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const hasOtherType = isLong ? asset.shortPositions > 0 : asset.longPositions > 0;

  return (
    <div
      className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-md border-l-4 ${
        isLong 
          ? 'border-red-500 bg-gradient-to-r from-red-50 to-red-25 hover:from-red-100 hover:to-red-50' 
          : 'border-green-500 bg-gradient-to-r from-green-50 to-green-25 hover:from-green-100 hover:to-green-50'
      }`}
      onClick={() => onAssetClick(asset.asset)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {isLong ? (
            <TrendingDown className="w-4 h-4 text-red-600" />
          ) : (
            <TrendingUp className="w-4 h-4 text-green-600" />
          )}
          <span className="font-bold text-gray-900 text-sm">{asset.asset}</span>
          
          {/* Badge de posições */}
          <Badge variant="outline" className="text-xs">
            {relevantPositions} posições
          </Badge>
          
          {/* Badge se tem liquidações do outro tipo */}
          {hasOtherType && (
            <Badge className="text-xs bg-purple-100 text-purple-800 border-purple-300">
              <Target className="w-3 h-3 mr-1" />
              Ambos
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Intensidade */}
          <span className={`px-2 py-1 rounded text-xs font-bold ${getIntensityColor(asset.intensity)}`}>
            {asset.intensity}
          </span>
          
          {/* Market Cap */}
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            asset.marketCap === 'high' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {asset.marketCap === 'high' ? 'HIGH' : 'LOW'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Liquidado:</span>
            <span className={`font-bold ${isLong ? 'text-red-600' : 'text-green-600'}`}>
              {formatAmount(relevantAmount)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Preço:</span>
            <span className="font-mono text-gray-700">{formatPrice(asset.price)}</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Geral:</span>
            <span className="font-bold text-purple-600">{formatAmount(asset.combinedTotal)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Última:</span>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-gray-500">{getTimeAgo(asset.lastUpdateTime)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tooltip info adicional */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            Long: {asset.longPositions}pos/{formatAmount(asset.longLiquidated)}
          </span>
          <span>
            Short: {asset.shortPositions}pos/{formatAmount(asset.shortLiquidated)}
          </span>
        </div>
      </div>
    </div>
  );
};
