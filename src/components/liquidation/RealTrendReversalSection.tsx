import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Zap, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { formatAmount } from '../../utils/liquidationUtils';
import { UnifiedTrendReversalAsset, TrendReversalData } from '../../types/trendReversal';
import { useAITrendReversal } from '../../hooks/useAITrendReversal';

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
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  // Convert Map to TrendReversalAsset array for AI hook
  const unifiedAssetsArray = useMemo(() => {
    return Array.from(unifiedAssets.values()).map(asset => ({
      asset: asset.asset,
      ticker: asset.ticker,
      price: asset.price,
      marketCap: asset.marketCap,
      longPositions: asset.longPositions,
      longLiquidated: asset.longLiquidated,
      shortPositions: asset.shortPositions,
      shortLiquidated: asset.shortLiquidated,
      totalPositions: asset.totalPositions,
      combinedTotal: asset.combinedTotal,
      dominantType: asset.dominantType,
      lastUpdateTime: asset.lastUpdateTime,
      firstDetectionTime: asset.firstDetectionTime,
      volatility: 0,
      intensity: asset.intensity,
      liquidationHistory: asset.liquidationHistory.map(liq => ({
        type: liq.type,
        amount: liq.amount,
        timestamp: liq.timestamp,
        change24h: liq.change24h
      }))
    }));
  }, [unifiedAssets]);

  // Create Map for AI hook
  const unifiedAssetsMap = useMemo(() => {
    const map = new Map();
    unifiedAssetsArray.forEach(asset => {
      map.set(asset.asset, asset);
    });
    return map;
  }, [unifiedAssetsArray]);

  // AI Analysis hook
  const { 
    aiAnalysis, 
    isAnalyzing, 
    analysisError,
    analyzePatterns,
    hasData 
  } = useAITrendReversal(unifiedAssetsMap);

  // Track asset history with optimized logic
  useEffect(() => {
    if (unifiedAssets.size === 0) return;

    console.log(`📊 Processing ${unifiedAssets.size} unified assets for trend reversal...`);

    setAssetHistoryCache(prevCache => {
      const newCache = new Map(prevCache);
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - 20 * 60 * 1000); // 20 minutes

      unifiedAssets.forEach((asset, assetName) => {
        const history = newCache.get(assetName) || [];
        
        // Add current snapshot if significantly different or first time
        const lastSnapshot = history[history.length - 1];
        const isSignificantChange = !lastSnapshot || 
          Math.abs(lastSnapshot.combinedTotal - asset.combinedTotal) > 1000 || // $1K difference
          lastSnapshot.dominantType !== asset.dominantType;

        if (isSignificantChange) {
          const updatedHistory = [
            ...history.filter(h => h.lastUpdateTime > cutoffTime),
            asset
          ].slice(-5); // Keep only last 5 snapshots
          
          newCache.set(assetName, updatedHistory);
          console.log(`📈 Updated history for ${assetName}: ${updatedHistory.length} snapshots`);
        }
      });

      return newCache;
    });
  }, [unifiedAssets]);

  // Detect REAL trend reversals with simplified algorithm
  const detectedReversals = useMemo(() => {
    const reversals: TrendReversalData[] = [];
    const now = new Date();

    console.log(`🔄 Analyzing ${assetHistoryCache.size} assets for reversals...`);

    assetHistoryCache.forEach((history, assetName) => {
      if (history.length < 2) return; // Need at least 2 data points

      // Sort history by time
      const sortedHistory = history.sort((a, b) => a.lastUpdateTime.getTime() - b.lastUpdateTime.getTime());
      
      // Compare latest vs previous snapshot
      const current = sortedHistory[sortedHistory.length - 1];
      const previous = sortedHistory[sortedHistory.length - 2];

      // Simple reversal detection: dominant type changed
      if (current.dominantType !== previous.dominantType) {
        const currentVolume = current.dominantType === 'long' ? current.longLiquidated : current.shortLiquidated;
        const previousVolume = previous.dominantType === 'long' ? previous.longLiquidated : previous.shortLiquidated;
        
        if (currentVolume > 5000 && previousVolume > 0) { // Minimum $5K threshold
          const reversalRatio = currentVolume / Math.max(previousVolume, 1);
          
          // Calculate intensity and confidence with relaxed criteria
          let intensity = 1;
          let confidence = 40; // Lower base confidence
          
          if (reversalRatio >= 3) { intensity = 5; confidence = 80; }
          else if (reversalRatio >= 2) { intensity = 4; confidence = 70; }
          else if (reversalRatio >= 1.5) { intensity = 3; confidence = 60; }
          else if (reversalRatio >= 1.2) { intensity = 2; confidence = 50; }
          
          // Boost confidence for high-cap assets
          if (current.marketCap === 'high') {
            confidence += 15;
          }

          const reversal: TrendReversalData = {
            asset: assetName,
            previousType: previous.dominantType,
            currentType: current.dominantType,
            previousVolume,
            currentVolume,
            reversalRatio,
            timestamp: current.lastUpdateTime,
            intensity,
            price: current.price,
            marketCap: current.marketCap,
            timeframe: '10min',
            confidence: Math.min(95, confidence)
          };
          
          // Accept reversals with confidence >= 40% (much more relaxed)
          if (confidence >= 40) {
            reversals.push(reversal);
            console.log(`🔄 REAL REVERSAL DETECTED: ${assetName} - ${previous.dominantType.toUpperCase()} -> ${current.dominantType.toUpperCase()} - Ratio: ${reversalRatio.toFixed(2)}x - Confidence: ${confidence}%`);
          }
        }
      }
    });

    // Sort by combination of confidence and ratio, limit to top 30
    const sortedReversals = reversals
      .sort((a, b) => {
        const aScore = a.confidence * Math.log(a.reversalRatio + 1);
        const bScore = b.confidence * Math.log(b.reversalRatio + 1);
        return bScore - aScore;
      })
      .slice(0, 30);

    console.log(`✅ Found ${sortedReversals.length} trend reversals`);
    return sortedReversals;
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
    if (confidence >= 80) return 'text-green-600 font-bold';
    if (confidence >= 65) return 'text-blue-600 font-semibold';
    if (confidence >= 50) return 'text-orange-600';
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
                  Detecta REAL reversões via Force Order - Algoritmo Otimizado v2.1
                </p>
              </div>
            </div>
            
            {/* AI Analysis Button */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  setShowAIAnalysis(!showAIAnalysis);
                  if (!showAIAnalysis) {
                    analyzePatterns();
                  }
                }}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Brain className="w-4 h-4 mr-2" />
                {isAnalyzing ? 'Analisando...' : 'Gerar Análise da IA'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-120px)]">
          {showAIAnalysis && (
            <div className="p-4 border-b border-purple-500/30">
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h4 className="text-lg font-semibold text-purple-300">Análise da IA</h4>
                </div>
                
                {isAnalyzing && (
                  <div className="flex items-center space-x-2 text-purple-400">
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Analisando padrões de liquidação...</span>
                  </div>
                )}
                
                {analysisError && (
                  <div className="text-red-400 text-sm">
                    Erro na análise: {analysisError}
                  </div>
                )}
                
                {hasData && aiAnalysis && (
                  <div className="space-y-3">
                    <div className="text-sm text-purple-300">
                      <strong>Padrões Detectados:</strong> {aiAnalysis.detectedPatterns.length}
                    </div>
                    
                    {aiAnalysis.detectedPatterns.slice(0, 3).map((pattern, index) => (
                      <div key={index} className="bg-purple-800/20 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-purple-200">{pattern.asset}</span>
                          <Badge className="bg-purple-600 text-white">
                            {pattern.confidence}% confiança
                          </Badge>
                        </div>
                        <div className="text-xs text-purple-300 mb-1">
                          <strong>{pattern.pattern}</strong>
                        </div>
                        <div className="text-xs text-purple-400">
                          {pattern.description}
                        </div>
                      </div>
                    ))}
                    
                    {aiAnalysis.marketSummary && (
                      <div className="bg-blue-800/20 rounded p-3">
                        <div className="text-sm font-bold text-blue-300 mb-1">
                          Resumo do Mercado
                        </div>
                        <div className="text-xs text-blue-400">
                          {aiAnalysis.marketSummary.recommendation}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {realTrendReversals.length > 0 ? (
            <ScrollArea className="h-full">
              <div className="space-y-3 p-4">
                {realTrendReversals.map((reversal, index) => (
                  <div
                    key={`${reversal.asset}-${reversal.timestamp.getTime()}-${index}`}
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
                        Algoritmo v2.1 • Confiança: 40%+ • Cache: {assetHistoryCache.size} assets • Reversões: {realTrendReversals.length}
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
