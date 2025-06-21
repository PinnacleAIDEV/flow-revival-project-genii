
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatAmount } from '../../utils/liquidationUtils';
import { useRealLongLiquidations } from '../../hooks/useRealLongLiquidations';
import { useRealShortLiquidations } from '../../hooks/useRealShortLiquidations';

export const RealLiquidationStats: React.FC = () => {
  const { longLiquidations } = useRealLongLiquidations();
  const { shortLiquidations } = useRealShortLiquidations();

  const stats = useMemo(() => {
    // REAL LONG data only
    const totalLongAmount = longLiquidations.reduce((sum, asset) => sum + asset.longLiquidated, 0);
    const totalLongPositions = longLiquidations.reduce((sum, asset) => sum + asset.longPositions, 0);
    const highCapLong = longLiquidations.filter(a => a.marketCap === 'high').length;
    const lowCapLong = longLiquidations.filter(a => a.marketCap === 'low').length;
    
    // REAL SHORT data only
    const totalShortAmount = shortLiquidations.reduce((sum, asset) => sum + asset.shortLiquidated, 0);
    const totalShortPositions = shortLiquidations.reduce((sum, asset) => sum + asset.shortPositions, 0);
    const highCapShort = shortLiquidations.filter(a => a.marketCap === 'high').length;
    const lowCapShort = shortLiquidations.filter(a => a.marketCap === 'low').length;
    
    // Combined totals (NO duplication - all REAL data)
    const totalCombined = totalLongAmount + totalShortAmount;
    const totalPositions = totalLongPositions + totalShortPositions;
    const totalAssets = longLiquidations.length + shortLiquidations.length;
    
    // Market dominance
    const longDominance = totalLongAmount > totalShortAmount;
    const dominanceRatio = totalLongAmount > 0 && totalShortAmount > 0 
      ? (longDominance 
          ? (totalLongAmount / totalShortAmount)
          : (totalShortAmount / totalLongAmount)
        )
      : 1;

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
        {/* REAL Long Stats */}
        <Card className="bg-red-950/50 border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2 text-red-300">
              <TrendingDown className="w-4 h-4" />
              <span>REAL Long Liquidations</span>
              <Badge className="bg-purple-600 text-white text-xs">REAL</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-red-400">
              {formatAmount(stats.totalLongAmount)}
            </div>
            <div className="flex items-center justify-between text-xs text-red-300">
              <span>{stats.totalLongPositions} REAL long positions</span>
              <span>{longLiquidations.length} assets</span>
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

        {/* REAL Short Stats */}
        <Card className="bg-green-950/50 border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2 text-green-300">
              <TrendingUp className="w-4 h-4" />
              <span>REAL Short Liquidations</span>
              <Badge className="bg-purple-600 text-white text-xs">REAL</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-green-400">
              {formatAmount(stats.totalShortAmount)}
            </div>
            <div className="flex items-center justify-between text-xs text-green-300">
              <span>{stats.totalShortPositions} REAL short positions</span>
              <span>{shortLiquidations.length} assets</span>
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

        {/* REAL Combined Stats */}
        <Card className="bg-purple-950/50 border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2 text-purple-300">
              <Target className="w-4 h-4" />
              <span>REAL Total Professional</span>
              <Badge className="bg-purple-600 text-white text-xs">$90/mo</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-purple-400">
              {formatAmount(stats.totalCombined)}
            </div>
            <div className="flex items-center justify-between text-xs text-purple-300">
              <span>{stats.totalPositions} REAL positions</span>
              <span>{stats.totalAssets} assets</span>
            </div>
            <div className="text-xs text-purple-200">
              L: {stats.totalLongPositions} | S: {stats.totalShortPositions}
            </div>
          </CardContent>
        </Card>

        {/* REAL Market Dominance */}
        <Card className="bg-gray-950/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2 text-gray-300">
              <Zap className="w-4 h-4" />
              <span>REAL Dominance</span>
              <Badge className="bg-purple-600 text-white text-xs">157.245.240.29</Badge>
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
