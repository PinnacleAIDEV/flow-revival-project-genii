
import React from 'react';
import { TrendingDown, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { formatAmount } from '../../utils/liquidationUtils';

// Interface local para dados unificados de liquidação
interface UnifiedLiquidationAsset {
  asset: string;
  ticker: string;
  price: number;
  marketCap: 'high' | 'low';
  longPositions: number;
  longLiquidated: number;
  shortPositions: number;
  shortLiquidated: number;
  totalPositions: number;
  combinedTotal: number;
  dominantType: 'long' | 'short';
  lastUpdateTime: Date;
  firstDetectionTime: Date;
  volatility: number;
  intensity: number;
  liquidationHistory: Array<{
    type: 'long' | 'short';
    amount: number;
    timestamp: Date;
    change24h: number;
  }>;
}

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
  
  // CORRIGIDO: Usar EXCLUSIVAMENTE valores do tipo específico
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

  // Verificar se há conflito de dados (debugging)
  const hasConflictingData = isLong 
    ? (asset.shortPositions > 0 || asset.shortLiquidated > 0)
    : (asset.longPositions > 0 || asset.longLiquidated > 0);

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
          
          <Badge variant="outline" className="text-xs">
            {relevantPositions} pos {isLong ? 'LONG' : 'SHORT'}
          </Badge>
          
          {hasConflictingData && (
            <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
              <AlertTriangle className="w-3 h-3 mr-1" />
              CONFLITO
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-bold ${getIntensityColor(asset.intensity)}`}>
            {asset.intensity}
          </span>
          
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
            <span className="text-gray-600">Liquidado {isLong ? 'LONG' : 'SHORT'}:</span>
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
            <span className="text-gray-600">Intensidade:</span>
            <span className={`font-bold ${isLong ? 'text-red-600' : 'text-green-600'}`}>
              {asset.intensity}/5
            </span>
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
      
      {/* DEBUG: Mostrar dados conflitantes se existirem */}
      {hasConflictingData && (
        <div className="mt-2 pt-2 border-t border-yellow-200 bg-yellow-50 rounded p-2">
          <div className="text-xs text-yellow-800">
            <strong>DEBUG:</strong> L:{asset.longPositions}pos/${formatAmount(asset.longLiquidated)} | 
            S:{asset.shortPositions}pos/${formatAmount(asset.shortLiquidated)}
          </div>
        </div>
      )}
    </div>
  );
};
