
import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { LiquidationBubble, TrendReversal } from '../../types/liquidation';
import { formatAmount } from '../../utils/liquidationUtils';

interface TrendReversalSectionProps {
  longLiquidations: LiquidationBubble[];
  shortLiquidations: LiquidationBubble[];
  onAssetClick: (asset: string) => void;
}

export const TrendReversalSection: React.FC<TrendReversalSectionProps> = ({
  longLiquidations,
  shortLiquidations,
  onAssetClick
}) => {
  const [trendReversals, setTrendReversals] = useState<TrendReversal[]>([]);

  // Detectar reversões de tendência - LÓGICA CORRIGIDA
  useEffect(() => {
    const detectReversals = () => {
      const reversals: TrendReversal[] = [];
      const now = new Date();
      const allLiquidations = [...longLiquidations, ...shortLiquidations];
      
      console.log(`🔄 Analisando ${allLiquidations.length} liquidações para reversões...`);

      // Agrupar liquidações por asset
      const assetGroups = new Map<string, LiquidationBubble[]>();
      
      allLiquidations.forEach(liq => {
        const existing = assetGroups.get(liq.asset) || [];
        existing.push(liq);
        assetGroups.set(liq.asset, existing);
      });

      assetGroups.forEach((liquidations, asset) => {
        // Precisamos de pelo menos uma liquidação long e uma short
        const longLiqs = liquidations.filter(l => l.type === 'long');
        const shortLiqs = liquidations.filter(l => l.type === 'short');
        
        if (longLiqs.length === 0 || shortLiqs.length === 0) return;

        // Pegar a liquidação mais recente de cada tipo
        const latestLong = longLiqs.reduce((latest, current) => 
          current.lastUpdateTime > latest.lastUpdateTime ? current : latest
        );
        
        const latestShort = shortLiqs.reduce((latest, current) => 
          current.lastUpdateTime > latest.lastUpdateTime ? current : latest
        );

        // Determinar qual tipo é mais recente (direção atual)
        const isLongMoreRecent = latestLong.lastUpdateTime > latestShort.lastUpdateTime;
        const currentType = isLongMoreRecent ? 'long' : 'short';
        const previousType = isLongMoreRecent ? 'short' : 'long';
        
        const currentLiq = isLongMoreRecent ? latestLong : latestShort;
        const previousLiq = isLongMoreRecent ? latestShort : latestLong;

        // Calcular ratio de reversão baseado em amounts
        const currentVolume = currentLiq.amount;
        const previousVolume = previousLiq.amount;
        
        if (previousVolume <= 0) return;
        
        const reversalRatio = currentVolume / previousVolume;
        
        // Critério: reversão significativa (ratio >= 1.2) e recente (últimos 10 minutos)
        const timeDiff = (now.getTime() - currentLiq.lastUpdateTime.getTime()) / (1000 * 60);
        
        if (reversalRatio >= 1.2 && timeDiff <= 10) {
          // Calcular intensidade baseada no ratio
          let intensity = 1;
          if (reversalRatio >= 5) intensity = 5;
          else if (reversalRatio >= 3) intensity = 4;
          else if (reversalRatio >= 2) intensity = 3;
          else if (reversalRatio >= 1.5) intensity = 2;
          
          const reversal: TrendReversal = {
            asset: currentLiq.asset,
            previousType,
            currentType,
            previousVolume,
            currentVolume,
            reversalRatio,
            timestamp: currentLiq.lastUpdateTime,
            intensity,
            price: currentLiq.price,
            marketCap: currentLiq.marketCap
          };
          
          reversals.push(reversal);
          
          console.log(`🔄 TREND REVERSAL detectado: ${asset} - ${previousType.toUpperCase()} -> ${currentType.toUpperCase()} - Ratio: ${reversalRatio.toFixed(2)}x`);
        }
      });

      // Ordenar por ratio de reversão e tempo
      const sortedReversals = reversals
        .sort((a, b) => {
          if (b.reversalRatio !== a.reversalRatio) {
            return b.reversalRatio - a.reversalRatio;
          }
          return b.timestamp.getTime() - a.timestamp.getTime();
        })
        .slice(0, 20);

      setTrendReversals(sortedReversals);
      
      if (sortedReversals.length > 0) {
        console.log(`✅ ${sortedReversals.length} reversões detectadas`);
      }
    };

    // Executar detecção sempre que houver mudanças nas liquidações
    if (longLiquidations.length > 0 || shortLiquidations.length > 0) {
      detectReversals();
    }
  }, [longLiquidations, shortLiquidations]);

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
                  <span>TREND REVERSAL DETECTOR</span>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {trendReversals.length} reversals
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-400 font-mono">
                  Detecta ativos que mudaram de direção de liquidação nos últimos 10min
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-120px)]">
          {trendReversals.length > 0 ? (
            <ScrollArea className="h-full">
              <div className="space-y-3 p-4">
                {trendReversals.map((reversal, index) => (
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
                          {reversal.reversalRatio.toFixed(2)}x
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
                            {reversal.previousType.toUpperCase()}
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
                            {reversal.currentType.toUpperCase()}
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
                          Preço: {formatPrice(reversal.price)}
                        </span>
                        <span className="text-gray-500">
                          {new Intl.DateTimeFormat('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
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
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Analisando Reversões</h4>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    Monitorando mudanças de direção nas liquidações para identificar reversões de tendência...
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
