
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatAmount } from '../../utils/liquidationUtils';
import { useLongLiquidations } from '../../hooks/useLongLiquidations';
import { useShortLiquidations } from '../../hooks/useShortLiquidations';

export const LiquidationStats: React.FC = () => {
  const { longLiquidations } = useLongLiquidations();
  const { shortLiquidations } = useShortLiquidations();

  const stats = useMemo(() => {
    // CORRIGIDO: Calcular totais APENAS dos valores específicos de cada tipo
    const totalLongAmount = longLiquidations.reduce((sum, asset) => sum + asset.longLiquidated, 0);
    const totalLongPositions = longLiquidations.reduce((sum, asset) => sum + asset.longPositions, 0);
    const highCapLong = longLiquidations.filter(a => a.marketCap === 'high').length;
    const lowCapLong = longLiquidations.filter(a => a.marketCap === 'low').length;
    
    const totalShortAmount = shortLiquidations.reduce((sum, asset) => sum + asset.shortLiquidated, 0);
    const totalShortPositions = shortLiquidations.reduce((sum, asset) => sum + asset.shortPositions, 0);
    const highCapShort = shortLiquidations.filter(a => a.marketCap === 'high').length;
    const lowCapShort = shortLiquidations.filter(a => a.marketCap === 'low').length;
    
    // Calcular estatísticas combinadas
    const totalCombined = totalLongAmount + totalShortAmount;
    const totalPositions = totalLongPositions + totalShortPositions;
    const totalAssets = longLiquidations.length + shortLiquidations.length;
    
    // Determinar dominância baseada APENAS nos valores específicos
    const longDominance = totalLongAmount > totalShortAmount;
    const dominanceRatio = longDominance 
      ? (totalLongAmount / Math.max(totalShortAmount, 1))
      : (totalShortAmount / Math.max(totalLongAmount, 1));
    
    console.log(`📊 STATS CORRETOS:`, {
      totalLongAmount: formatAmount(totalLongAmount),
      totalShortAmount: formatAmount(totalShortAmount),
      totalLongPositions,
      totalShortPositions,
      longDominance,
      dominanceRatio: dominanceRatio.toFixed(2)
    });
    
    return {
      totalLongAmount,
      totalShortAmount,
      totalCombined,
      totalLongPositions,
      totalShortPositions,
      totalPositions,
      totalAssets,
      highCapLong,
      lowCapLong,
      highCapShort,
      lowCapShort,
      longDominance,
      dominanceRatio
    };
  }, [longLiquidations, shortLiquidations]);

  const getDominanceColor = (ratio: number) => {
    if (ratio >= 3) return 'text-red-600';
    if (ratio >= 2) return 'text-orange-600';
    if (ratio >= 1.5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getDominanceIntensity = (ratio: number) => {
    if (ratio >= 3) return 'EXTREMA';
    if (ratio >= 2) return 'ALTA';
    if (ratio >= 1.5) return 'MODERADA';
    return 'EQUILIBRADA';
  };

  return (
    <div className="p-4 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Long Liquidations Stats */}
        <Card className="bg-red-950/50 border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2 text-red-300">
              <TrendingDown className="w-4 h-4" />
              <span>Long Liquidations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-red-400">
              {formatAmount(stats.totalLongAmount)}
            </div>
            <div className="flex items-center justify-between text-xs text-red-300">
              <span>{stats.totalLongPositions} posições LONG</span>
              <span>{longLiquidations.length} ativos</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <Badge variant="outline" className="border-blue-400 text-blue-300">
                HIGH: {stats.highCapLong}
              </Badge>
              <Badge variant="outline" className="border-gray-400 text-gray-300">
                LOW: {stats.lowCapLong}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Short Liquidations Stats */}
        <Card className="bg-green-950/50 border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2 text-green-300">
              <TrendingUp className="w-4 h-4" />
              <span>Short Liquidations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-green-400">
              {formatAmount(stats.totalShortAmount)}
            </div>
            <div className="flex items-center justify-between text-xs text-green-300">
              <span>{stats.totalShortPositions} posições SHORT</span>
              <span>{shortLiquidations.length} ativos</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <Badge variant="outline" className="border-blue-400 text-blue-300">
                HIGH: {stats.highCapShort}
              </Badge>
              <Badge variant="outline" className="border-gray-400 text-gray-300">
                LOW: {stats.lowCapShort}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Combined Stats */}
        <Card className="bg-purple-950/50 border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2 text-purple-300">
              <Target className="w-4 h-4" />
              <span>Total Geral</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-purple-400">
              {formatAmount(stats.totalCombined)}
            </div>
            <div className="flex items-center justify-between text-xs text-purple-300">
              <span>{stats.totalPositions} posições</span>
              <span>{stats.totalAssets} ativos</span>
            </div>
            <div className="text-xs text-purple-300">
              Monitoramento ativo em tempo real
            </div>
          </CardContent>
        </Card>

        {/* Market Dominance */}
        <Card className="bg-gray-950/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2 text-gray-300">
              <Zap className="w-4 h-4" />
              <span>Dominância</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`text-lg font-bold ${getDominanceColor(stats.dominanceRatio)}`}>
              {stats.longDominance ? 'LONG' : 'SHORT'}
            </div>
            <div className={`text-sm ${getDominanceColor(stats.dominanceRatio)}`}>
              {getDominanceIntensity(stats.dominanceRatio)}
            </div>
            <div className="text-xs text-gray-400">
              Ratio: {stats.dominanceRatio.toFixed(2)}x
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
