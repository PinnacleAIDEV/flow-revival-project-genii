
import React, { useEffect } from 'react';
import { RotateCcw, TrendingUp, TrendingDown, Zap, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { LiquidationBubble } from '../../types/liquidation';
import { formatAmount } from '../../utils/liquidationUtils';
import { useTrendReversalHistory } from '../../hooks/useTrendReversalHistory';

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
  const { detectedReversals, processLiquidation, assetHistorySize } = useTrendReversalHistory();

  // Processar novas liquidações
  useEffect(() => {
    [...longLiquidations, ...shortLiquidations].forEach(liquidation => {
      processLiquidation(liquidation);
    });
  }, [longLiquidations, shortLiquidations, processLiquidation]);

  const formatTimestamp = (timestamp: Date) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(timestamp);
    } catch (error) {
      return '--:--:--';
    }
  };

  const getReversalIcon = (fromType: 'long' | 'short', toType: 'long' | 'short') => {
    if (fromType === 'long' && toType === 'short') {
      return <div className="flex items-center space-x-1">
        <TrendingDown className="w-4 h-4 text-red-400" />
        <ArrowRight className="w-3 h-3 text-gray-400" />
        <TrendingUp className="w-4 h-4 text-green-400" />
      </div>;
    }
    return <div className="flex items-center space-x-1">
      <TrendingUp className="w-4 h-4 text-green-400" />
      <ArrowRight className="w-3 h-3 text-gray-400" />
      <TrendingDown className="w-4 h-4 text-red-400" />
    </div>;
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-red-400';
    if (strength >= 60) return 'text-orange-400';
    if (strength >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="h-full">
      <Card className="bg-gray-900/90 backdrop-blur-sm border-purple-500 h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2 text-purple-400 font-mono">
                  <span>TREND REVERSAL DETECTOR v2.0</span>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {detectedReversals.length} reversões
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-400 font-mono">
                  Sistema temporal inteligente • {assetHistorySize} ativos rastreados
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-7rem)]">
          {detectedReversals.length > 0 ? (
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-3">
                {detectedReversals.map((reversal, index) => (
                  <div 
                    key={`${reversal.asset}-${reversal.lastProcessed.getTime()}`}
                    className={`p-4 rounded-lg border-l-4 cursor-pointer hover:bg-gray-800/50 transition-colors ${
                      reversal.toType === 'short' 
                        ? 'bg-green-500/10 border-green-500' 
                        : 'bg-red-500/10 border-red-500'
                    }`}
                    onClick={() => onAssetClick(reversal.asset)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getReversalIcon(reversal.fromType, reversal.toType)}
                        <span className="font-bold text-white text-sm">{reversal.asset}</span>
                        <Badge className={`text-xs ${
                          reversal.toType === 'short' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {reversal.fromType.toUpperCase()}→{reversal.toType.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs font-bold ${getStrengthColor(reversal.strength)}`}>
                          ⚡ {reversal.strength.toFixed(0)}
                        </Badge>
                        <span className="text-xs text-gray-400 font-mono">
                          {formatTimestamp(reversal.lastProcessed)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-gray-300">{reversal.reason}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-400">⚡ Volume Ratio:</span>
                            <span className="text-yellow-400 font-bold">
                              {reversal.volumeRatio.toFixed(1)}x
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">📊 Intensidade Δ:</span>
                            <span className="text-orange-400 font-bold">
                              +{reversal.intensityDelta.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-400">⏱️ Timeframe:</span>
                            <span className="text-cyan-400 font-mono">
                              {reversal.timeFrame.toFixed(1)}min
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">💰 Valor Atual:</span>
                            <span className="text-white font-mono">
                              {formatAmount(reversal.currentLiquidation.amount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-700 pt-2 mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-400">
                              Preço: ${reversal.currentLiquidation.price.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400">24h:</span>
                            <span className={`font-mono ${
                              reversal.currentLiquidation.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {reversal.currentLiquidation.change24h >= 0 ? '+' : ''}{reversal.currentLiquidation.change24h.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div className="space-y-3">
                <RotateCcw className="w-12 h-12 text-gray-500 mx-auto animate-spin" />
                <h4 className="text-lg font-medium text-gray-400 font-mono">ANALISANDO PADRÕES</h4>
                <p className="text-gray-500 text-sm">Sistema temporal inteligente ativo</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>🔍 Rastreando {assetHistorySize} ativos</p>
                  <p>⏱️ Janela temporal: 5 minutos</p>
                  <p>🎯 Detectando mudanças Long↔Short</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
