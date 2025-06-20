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
  const [liquidationHistory, setLiquidationHistory] = useState<Map<string, LiquidationBubble[]>>(new Map());

  // Detectar reversões de tendência
  useEffect(() => {
    const updateHistory = () => {
      const newHistory = new Map(liquidationHistory);
      
      // Adicionar novas liquidações ao histórico
      [...longLiquidations, ...shortLiquidations].forEach(liq => {
        const assetHistory = newHistory.get(liq.asset) || [];
        const exists = assetHistory.some(h => h.id === liq.id);
        
        if (!exists) {
          assetHistory.push(liq);
          // Manter apenas últimas 10 liquidações por ativo
          if (assetHistory.length > 10) {
            assetHistory.splice(0, assetHistory.length - 10);
          }
          newHistory.set(liq.asset, assetHistory);
        }
      });
      
      setLiquidationHistory(newHistory);
    };

    updateHistory();
  }, [longLiquidations, shortLiquidations, liquidationHistory]);

  useEffect(() => {
    const detectReversals = () => {
      const reversals: TrendReversal[] = [];
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      liquidationHistory.forEach((history, asset) => {
        if (history.length < 3) return; // Precisamos de pelo menos 3 pontos de dados

        // Filtrar liquidações recentes
        const recentHistory = history.filter(h => h.lastUpdateTime > thirtyMinutesAgo);
        if (recentHistory.length < 3) return;

        // Ordenar por timestamp
        recentHistory.sort((a, b) => a.lastUpdateTime.getTime() - b.lastUpdateTime.getTime());

        // Analisar padrão de liquidação
        const firstHalf = recentHistory.slice(0, Math.floor(recentHistory.length / 2));
        const secondHalf = recentHistory.slice(Math.floor(recentHistory.length / 2));

        if (firstHalf.length === 0 || secondHalf.length === 0) return;

        // Calcular tipo dominante em cada período
        const firstHalfLongVolume = firstHalf
          .filter(h => h.type === 'long')
          .reduce((sum, h) => sum + h.totalLiquidated, 0);
        
        const firstHalfShortVolume = firstHalf
          .filter(h => h.type === 'short')
          .reduce((sum, h) => sum + h.totalLiquidated, 0);

        const secondHalfLongVolume = secondHalf
          .filter(h => h.type === 'long')
          .reduce((sum, h) => sum + h.totalLiquidated, 0);
        
        const secondHalfShortVolume = secondHalf
          .filter(h => h.type === 'short')
          .reduce((sum, h) => sum + h.totalLiquidated, 0);

        // Determinar tipo dominante
        const firstPeriodType = firstHalfLongVolume > firstHalfShortVolume ? 'long' : 'short';
        const secondPeriodType = secondHalfLongVolume > secondHalfShortVolume ? 'long' : 'short';

        // Detectar reversão
        if (firstPeriodType !== secondPeriodType) {
          const previousVolume = firstPeriodType === 'long' ? firstHalfLongVolume : firstHalfShortVolume;
          const currentVolume = secondPeriodType === 'long' ? secondHalfLongVolume : secondHalfShortVolume;
          
          // Verificar se volume atual >= volume anterior (critério de reversão)
          if (currentVolume >= previousVolume && previousVolume > 0) {
            const reversalRatio = currentVolume / previousVolume;
            const latestLiq = recentHistory[recentHistory.length - 1];
            
            // Calcular intensidade da reversão
            let intensity = 1;
            if (reversalRatio >= 3) intensity = 5;
            else if (reversalRatio >= 2.5) intensity = 4;
            else if (reversalRatio >= 2) intensity = 3;
            else if (reversalRatio >= 1.5) intensity = 2;
            
            const reversal: TrendReversal = {
              asset,
              previousType: firstPeriodType,
              currentType: secondPeriodType,
              previousVolume,
              currentVolume,
              reversalRatio,
              timestamp: latestLiq.lastUpdateTime,
              intensity,
              price: latestLiq.price,
              marketCap: latestLiq.marketCap
            };
            
            reversals.push(reversal);
            
            console.log(`🔄 TREND REVERSAL detectado: ${asset} - ${firstPeriodType.toUpperCase()} -> ${secondPeriodType.toUpperCase()} - Ratio: ${reversalRatio.toFixed(2)}x`);
          }
        }
      });

      // Ordenar por ratio de reversão e limitar a 20
      const sortedReversals = reversals
        .sort((a, b) => b.reversalRatio - a.reversalRatio)
        .slice(0, 20);

      setTrendReversals(sortedReversals);
    };

    if (liquidationHistory.size > 0) {
      detectReversals();
    }
  }, [liquidationHistory]);

  const formatAmount = (amount: number) => {
    if (!amount || isNaN(amount)) return '$0.00';
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

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
                  Detecta ativos que mudaram de direção de liquidação
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
                            {reversal.previousType.toUpperCase()} LIQUIDATIONS
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
                            {reversal.currentType.toUpperCase()} LIQUIDATIONS
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
