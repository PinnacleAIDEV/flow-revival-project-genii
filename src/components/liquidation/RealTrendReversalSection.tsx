
import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { formatAmount } from '../../utils/liquidationUtils';
import { UnifiedTrendReversalAsset, TrendReversalData } from '../../types/trendReversal';

interface RealTrendReversalSectionProps {
  unifiedAssets: Map<string, UnifiedTrendReversalAsset>;
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
  const [realTrendReversals, setRealTrendReversals] = useState<TrendReversalData[]>([]);
  const [assetHistoryCache, setAssetHistoryCache] = useState<Map<string, UnifiedTrendReversalAsset[]>>(new Map());

  // Track asset history with throttling
  useEffect(() => {
    const updateAssetHistory = () => {
      const newCache = new Map(assetHistoryCache);
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes

      unifiedAssets.forEach((asset, assetName) => {
        const history = newCache.get(assetName) || [];
        
        // Check if this is a new update (avoid duplicates)
        const lastHistoryItem = history[history.length - 1];
        const isNewUpdate = !lastHistoryItem || 
          lastHistoryItem.lastUpdateTime.getTime() !== asset.lastUpdateTime.getTime() ||
          lastHistoryItem.combinedTotal !== asset.combinedTotal;

        if (isNewUpdate) {
          // Add new snapshot and limit history size
          const updatedHistory = [...history, asset]
            .filter(h => h.lastUpdateTime > cutoffTime)
            .slice(-10); // Keep only last 10 snapshots per asset
          
          newCache.set(assetName, updatedHistory);
        }
      });

      setAssetHistoryCache(newCache);
    };

    if (unifiedAssets.size > 0) {
      // Throttle updates to every 5 seconds
      const throttleTimer = setTimeout(updateAssetHistory, 5000);
      return () => clearTimeout(throttleTimer);
    }
  }, [unifiedAssets, assetHistoryCache]);

  // Detect REAL trend reversals with improved algorithm
  const detectedReversals = useMemo(() => {
    const reversals: TrendReversalData[] = [];
    const now = new Date();
    const analysisWindow = new Date(now.getTime() - 20 * 60 * 1000); // 20 minutes

    assetHistoryCache.forEach((history, assetName) => {
      if (history.length < 4) return; // Need at least 4 data points

      // Filter recent history within analysis window
      const recentHistory = history
        .filter(h => h.lastUpdateTime > analysisWindow)
        .sort((a, b) => a.lastUpdateTime.getTime() - b.lastUpdateTime.getTime());

      if (recentHistory.length < 4) return;

      // Split into two periods for trend analysis
      const midPoint = Math.floor(recentHistory.length / 2);
      const firstPeriod = recentHistory.slice(0, midPoint);
      const secondPeriod = recentHistory.slice(midPoint);

      if (firstPeriod.length === 0 || secondPeriod.length === 0) return;

      // Calculate dominant liquidation type in each period
      const firstPeriodLongVol = firstPeriod.reduce((sum, h) => sum + h.longLiquidated, 0);
      const firstPeriodShortVol = firstPeriod.reduce((sum, h) => sum + h.shortLiquidated, 0);
      const secondPeriodLongVol = secondPeriod.reduce((sum, h) => sum + h.longLiquidated, 0);
      const secondPeriodShortVol = secondPeriod.reduce((sum, h) => sum + h.shortLiquidated, 0);

      const firstDominantType = firstPeriodLongVol > firstPeriodShortVol ? 'long' : 'short';
      const secondDominantType = secondPeriodLongVol > secondPeriodShortVol ? 'long' : 'short';

      // Detect reversal with improved criteria
      if (firstDominantType !== secondDominantType) {
        const previousVolume = firstDominantType === 'long' ? firstPeriodLongVol : firstPeriodShortVol;
        const currentVolume = secondDominantType === 'long' ? secondPeriodLongVol : secondPeriodShortVol;
        
        // Enhanced reversal validation
        if (currentVolume > 0 && previousVolume > 0) {
          const reversalRatio = currentVolume / previousVolume;
          const minReversalThreshold = 1.2; // Must be at least 20% stronger
          
          if (reversalRatio >= minReversalThreshold) {
            const latestAsset = recentHistory[recentHistory.length - 1];
            
            // Calculate confidence and intensity
            let intensity = 1;
            let confidence = 50;
            
            if (reversalRatio >= 4) { intensity = 5; confidence = 95; }
            else if (reversalRatio >= 3) { intensity = 4; confidence = 85; }
            else if (reversalRatio >= 2.5) { intensity = 3; confidence = 75; }
            else if (reversalRatio >= 1.8) { intensity = 2; confidence = 65; }
            else { confidence = Math.round(40 + (reversalRatio - 1) * 25); }

            // Additional confidence boost for high-cap assets
            if (latestAsset.marketCap === 'high') {
              confidence = Math.min(95, confidence + 10);
            }

            const reversal: TrendReversalData = {
              asset: assetName,
              previousType: firstDominantType,
              currentType: secondDominantType,
              previousVolume,
              currentVolume,
              reversalRatio,
              timestamp: latestAsset.lastUpdateTime,
              intensity,
              price: latestAsset.price,
              marketCap: latestAsset.marketCap,
              timeframe: '20min',
              confidence
            };
            
            // Only include high-confidence reversals
            if (confidence >= 60) {
              reversals.push(reversal);
              console.log(`🔄 REAL TREND REVERSAL: ${assetName} - ${firstDominantType.toUpperCase()} -> ${secondDominantType.toUpperCase()} - Ratio: ${reversalRatio.toFixed(2)}x - Confidence: ${confidence}%`);
            }
          }
        }
      }
    });

    // Sort by confidence and reversal ratio, limit to top 25
    return reversals
      .sort((a, b) => {
        const aScore = a.confidence * a.reversalRatio;
        const bScore = b.confidence * b.reversalRatio;
        return bScore - aScore;
      })
      .slice(0, 25);
  }, [assetHistoryCache]);

  // Update state with detected reversals
  useEffect(() => {
    setRealTrendReversals(detectedReversals);
  }, [detectedReversals]);

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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 font-bold';
    if (confidence >= 70) return 'text-blue-600 font-semibold';
    if (confidence >= 60) return 'text-orange-600';
    return 'text-gray-600';
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
                  Detecta REAL reversões via Force Order - Algoritmo Otimizado v2.0
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
                        <span className={`text-xs font-bold ${getConfidenceColor(reversal.confidence)}`}>
                          {reversal.confidence}% conf
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getIntensityColor(reversal.intensity)}`}>
                          Int {reversal.intensity}
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
                    Aguardando dados suficientes para detectar reversões de tendência profissionais...
                  </p>
                  {professionalData && (
                    <div className="mt-3 space-y-1">
                      <p className="text-purple-600 text-xs font-semibold">
                        Professional Force Order Data
                      </p>
                      <p className="text-gray-400 text-xs">
                        Algoritmo v2.0 • Confiança: 60%+ • Cache: {assetHistoryCache.size} assets
                      </p>
                    </div>
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
