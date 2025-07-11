
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { LongLiquidationAsset } from '../../types/separatedLiquidation';
import { ShortLiquidationAsset } from '../../types/separatedLiquidation';
import { UnifiedLiquidationRow } from './UnifiedLiquidationRow';

// Tipo união para assets que podem ser long ou short
type LiquidationAsset = LongLiquidationAsset | ShortLiquidationAsset;

interface UnifiedLiquidationTableProps {
  title: string;
  assets: LiquidationAsset[];
  type: 'long' | 'short';
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  onAssetClick: (asset: string) => void;
}

export const UnifiedLiquidationTable: React.FC<UnifiedLiquidationTableProps> = ({
  title,
  assets,
  type,
  icon: Icon,
  bgColor,
  textColor,
  onAssetClick
}) => {
  const highCapCount = assets.filter(a => a.marketCap === 'high').length;
  const lowCapCount = assets.filter(a => a.marketCap === 'low').length;
  
  // Calcular totais baseado no tipo
  const totalPositions = assets.reduce((sum, asset) => {
    if (type === 'long' && 'longPositions' in asset) {
      return sum + asset.longPositions;
    } else if (type === 'short' && 'shortPositions' in asset) {
      return sum + asset.shortPositions;
    }
    return sum;
  }, 0);
  
  const totalLiquidated = assets.reduce((sum, asset) => {
    if (type === 'long' && 'longLiquidated' in asset) {
      return sum + asset.longLiquidated;
    } else if (type === 'short' && 'shortLiquidated' in asset) {
      return sum + asset.shortLiquidated;
    }
    return sum;
  }, 0);

  return (
    <Card className="flex-1 bg-white/95 backdrop-blur-sm border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className={`flex items-center space-x-2 ${textColor} font-mono`}>
                <span>{title}</span>
                <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                  {assets.length} assets
                </Badge>
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{totalPositions} posições {type.toUpperCase()}</span>
                <span>${(totalLiquidated / 1e6).toFixed(1)}M liquidado {type.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-2">
          <Badge variant="outline" className="text-xs">
            HIGH CAP: {highCapCount}
          </Badge>
          <Badge variant="outline" className="text-xs">
            LOW CAP: {lowCapCount}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100vh-280px)]">
        {assets.length > 0 ? (
          <ScrollArea className="h-full">
            <div className="space-y-2 p-4">
              {assets.map((asset) => (
                <UnifiedLiquidationRow
                  key={asset.asset}
                  asset={asset}
                  type={type}
                  onAssetClick={onAssetClick}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div className="space-y-4">
              <div className={`w-16 h-16 ${bgColor.replace('bg-', 'bg-').replace('-600', '-100')} rounded-full flex items-center justify-center mx-auto`}>
                <Icon className={`w-8 h-8 ${textColor}`} />
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Aguardando {title}</h4>
                <p className="text-gray-500 text-sm max-w-xs">
                  Monitorando liquidações de {type === 'long' ? 'posições longas (quedas)' : 'posições short (altas)'} em tempo real...
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
