import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { formatAmount } from '../../utils/liquidationUtils';

interface RealTrendReversalAsset {
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
  intensity: number;
  liquidationHistory: Array<{
    type: 'long' | 'short';
    amount: number;
    timestamp: Date;
    change24h: number;
  }>;
}

interface RealTrendReversal {
  asset: string;
  previousType: 'long' | 'short';
  currentType: 'long' | 'short';
  previousVolume: number;
  currentVolume: number;
  reversalRatio: number;
  timestamp: Date;
  intensity: number;
  price: number;
  marketCap: 'high' | 'low';
  timeframe: string;
}

interface RealTrendReversalSectionProps {
  unifiedAssets: Map<string, RealTrendReversalAsset>;
  onAssetClick: (asset: string) => void;
  isRealData: boolean;
  professionalData: boolean;
}

export const RealTrendReversalSection: React.FC<RealTrendReversalSectionProps> = ({
  unifiedAssets,
  onAssetClick,
  isRealData,
  professionalData
}) => {
  const [realTrendReversals, setRealTrendReversals] = useState<RealTrendReversal[]>([]);
  const [liquidationHistory, setLiquidationHistory] = useState<Map<string, RealTrendReversalAsset[]>>(new Map());

  // Track REAL liquidation history
  useEffect(() => {
    const updateRealHistory = () => {
      const newHistory = new Map(liquidationHistory);
      
      unifiedAssets.forEach((asset, assetName) => {
        const assetHistory = newHistory.get(assetName) || [];
        const exists = assetHistory.some(h => 
          h.lastUpdateTime.getTime() === asset.lastUpdateTime.getTime()
        );
        
        if (!exists) {
          assetHistory.push(asset);
          // Keep last 15 REAL liquidation snapshots per asset
          if (assetHistory.length > 15) {
            assetHistory.splice(0, assetHistory.length - 15);
          }
          newHistory.set(assetName, assetHistory);
        }
      });
      
      setLiquidationHistory(newHistory);
    };

    if (unifiedAssets.size > 0) {
      updateRealHistory();
    }
  }, [unifiedAssets, liquidationHistory]);

  // Detect REAL trend reversals
  useEffect(() => {
    const detectRealReversals = () => {
      const reversals: RealTrendReversal[] = [];
      const now = new Date();
      const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);

      liquidationHistory.forEach((history, asset) => {
        if (history.length < 4) return; // Need at least 4 REAL data points

        // Filter recent REAL history
        const recentHistory = history.filter(h => h.lastUpdateTime > twentyMinutesAgo);
        if (recentHistory.length < 4) return;

        // Sort by timestamp
        recentHistory.sort((a, b) => a.lastUpdateTime.getTime() - b.lastUpdateTime.getTime());

        // Split into periods for REAL reversal analysis
        const midPoint = Math.floor(recentHistory.length / 2);
        const firstPeriod = recentHistory.slice(0, midPoint);
        const secondPeriod = recentHistory.slice(midPoint);

        if (firstPeriod.length === 0 || secondPeriod.length === 0) return;

        // Calculate REAL dominant type in each period
        const firstLongVolume = firstPeriod.reduce((sum, h) => sum + h.longLiquidated, 0);
        const firstShortVolume = firstPeriod.reduce((sum, h) => sum + h.shortLiquidated, 0);
        const secondLongVolume = secondPeriod.reduce((sum, h) => sum + h.longLiquidated, 0);
        const secondShortVolume = secondPeriod.reduce((sum, h) => sum + h.shortLiquidated, 0);

        const firstPeriodType = firstLongVolume > firstShortVolume ? 'long' : 'short';
        const secondPeriodType = secondLongVolume > secondShortVolume ? 'long' : 'short';

        // Detect REAL reversal
        if (firstPeriodType !== secondPeriodType) {
          const previousVolume = firstPeriodType === 'long' ? firstLongVolume : firstShortVolume;
          const currentVolume = secondPeriodType === 'long' ? secondLongVolume : secondShortVolume;
          
          if (currentVolume >= previousVolume && previousVolume > 0) {
            const reversalRatio = currentVolume / previousVolume;
            const latestAsset = recentHistory[recentHistory.length - 1];
            
            let intensity = 1;
            if (reversalRatio >= 4) intensity = 5;
            else if (reversalRatio >= 3) intensity = 4;
            else if (reversalRatio >= 2.5) intensity = 3;
            else if (reversalRatio >= 1.8) intensity = 2;
            
            const realReversal: RealTrendReversal = {
              asset,
              previousType: firstPeriodType,
              currentType: secondPeriodType,
              previousVolume,
              currentVolume,
              reversalRatio,
              timestamp: latestAsset.lastUpdateTime,
              intensity,
              price: latestAsset.price,
              marketCap: latestAsset.marketCap,
              timeframe: '20min'
            };
            
            reversals.push(realReversal);
            
            console.log(`🔄 REAL TREND REVERSAL: ${asset} - ${firstPeriodType.toUpperCase()} -> ${secondPeriodType.toUpperCase()} - Ratio: ${reversalRatio.toFixed(2)}x`);
          }
        }
      });

      // Sort by REAL reversal ratio and limit to 25
      const sortedReversals = reversals
        .sort((a, b) => b.reversalRatio - a.reversalRatio)
        .slice(0, 25);

      setRealTrendReversals(sortedReversals);
    };

    if (liquidationHistory.size > 0) {
      detectRealReversals();
    }
  }, [liquidationHistory]);

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '$0.00';
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const getIntensityColor = (intensity: number) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-orange-100 text-orange-800',
      4: 'bg-red-100 text-red-800',
      5: 'bg-purple-100 text-purple-800'
    };
    return colors[intensity as keyof typeof colors] || colors[1];
  };

  return (
    <div className="h-full">
      <Card className="bg-gray-900/90 backdrop-blur-sm border-purple-500 h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2 text-purple-400 font-mono">
                  <span>REAL TREND REVERSAL DETECTOR</span>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {realTrendReversals.length} REAL reversals
                  </Badge>
                  {professionalData && (
                    <Badge className="bg-green-600 text-white">
                      PROFESSIONAL
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-400 font-mono">
                  Detecta REAL reversões via Force Order data - droplet 157.245.240.29
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-120px)]">
          {realTrendReversals.length > 0 ? (
            <ScrollArea className="h-full">
              <div className="space-y-3 p-4">
                {realTrendReversals.map((reversal, index) => (
                  <div
                    key={`${reversal.asset}-${reversal.timestamp.getTime()}`}
                    className="p-4 rounded-lg border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-purple-25 hover:from-purple-100 hover:to-purple-50 transition-all cursor-pointer"
                    onClick={() => onAssetClick(reversal.asset)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {reversal.previousType === 'long' ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          )}
                          <Zap className="w-4 h-4 text-purple-600" />
                          {reversal.currentType === 'long' ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <span className="font-bold text-gray-900 text-lg">{reversal.asset}</span>
                        <Badge variant="outline" className="text-xs">
                          {reversal.reversalRatio.toFixed(2)}x REAL
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getIntensityColor(reversal.intensity)}`}>
                          Intensidade {reversal.intensity}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          reversal.marketCap === 'high' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {reversal.marketCap === 'high' ? 'HIGH CAP' : 'LOW CAP'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Direção Anterior:</span>
                          <span className={`font-bold ${reversal.previousType === 'long' ? 'text-red-600' : 'text-green-600'}`}>
                            {reversal.previousType.toUpperCase()} REAL
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Volume Anterior:</span>
                          <span className="font-mono text-gray-700">{formatAmount(reversal.previousVolume)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nova Direção:</span>
                          <span className={`font-bold ${reversal.currentType === 'long' ? 'text-red-600' : 'text-green-600'}`}>
                            {reversal.currentType.toUpperCase()} REAL
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Volume Atual:</span>
                          <span className="font-mono text-purple-600 font-bold">{formatAmount(reversal.currentVolume)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">
                          Preço REAL: {formatPrice(reversal.price)}
                        </span>
                        <span className="text-gray-500">
                          {new Intl.DateTimeFormat('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit'
                          }).format(reversal.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <RefreshCw className="w-8 h-8 text-purple-500" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Analisando REAL Reversões</h4>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Monitorando mudanças REAIS via Force Order para identificar reversões profissionais...
                  </p>
                  {professionalData && (
                    <p className="text-purple-600 text-xs mt-2 font-semibold">
                      $90/mês • 157.245.240.29 • Professional Data
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
