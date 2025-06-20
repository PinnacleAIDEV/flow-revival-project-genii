
import React from 'react';
import { RotateCcw, TrendingUp, TrendingDown, Zap, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { LiquidationBubble } from '../../types/liquidation';
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
  // Detectar reversões de tendência baseado em mudanças de volume
  const detectTrendReversals = () => {
    const reversals: Array<{
      asset: string;
      type: 'bullish' | 'bearish';
      strength: number;
      reason: string;
      liquidation: LiquidationBubble;
    }> = [];

    // Analisar liquidações long para reversões bullish (muitas liquidações long = possível alta)
    longLiquidations.forEach(liq => {
      if (liq.intensity >= 3 && Math.abs(liq.change24h) > 5) {
        const strength = (liq.intensity * 20) + Math.abs(liq.change24h);
        reversals.push({
          asset: liq.asset,
          type: 'bullish',
          strength,
          reason: `Liquidações LONG intensas (${liq.intensity}/5) com queda de ${Math.abs(liq.change24h).toFixed(1)}%`,
          liquidation: liq
        });
      }
    });

    // Analisar liquidações short para reversões bearish (muitas liquidações short = possível queda)
    shortLiquidations.forEach(liq => {
      if (liq.intensity >= 3 && Math.abs(liq.change24h) > 5) {
        const strength = (liq.intensity * 20) + Math.abs(liq.change24h);
        reversals.push({
          asset: liq.asset,
          type: 'bearish',
          strength,
          reason: `Liquidações SHORT intensas (${liq.intensity}/5) com alta de ${liq.change24h.toFixed(1)}%`,
          liquidation: liq
        });
      }
    });

    return reversals.sort((a, b) => b.strength - a.strength).slice(0, 20);
  };

  const trendReversals = detectTrendReversals();

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
                  <span>TREND REVERSAL DETECTOR</span>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {trendReversals.length} sinais
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-400 font-mono">
                  Detecção de possíveis reversões baseada em liquidações intensas
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-7rem)]">
          {trendReversals.length > 0 ? (
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-3">
                {trendReversals.map((reversal, index) => (
                  <div 
                    key={`${reversal.asset}-${index}`}
                    className={`p-4 rounded-lg border-l-4 cursor-pointer hover:bg-gray-800/50 transition-colors ${
                      reversal.type === 'bullish' 
                        ? 'bg-green-500/10 border-green-500' 
                        : 'bg-red-500/10 border-red-500'
                    }`}
                    onClick={() => onAssetClick(reversal.asset)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {reversal.type === 'bullish' ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <span className="font-bold text-white text-sm">{reversal.asset}</span>
                        <Badge className={`text-xs ${
                          reversal.type === 'bullish' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {reversal.type === 'bullish' ? 'BULLISH' : 'BEARISH'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                          Força: {reversal.strength.toFixed(0)}
                        </Badge>
                        <span className="text-xs text-gray-400 font-mono">
                          {formatTimestamp(reversal.liquidation.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-gray-300">{reversal.reason}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Preço:</span>
                            <span className="text-white font-mono">
                              ${reversal.liquidation.price.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Liquidação:</span>
                            <span className="text-yellow-400 font-mono">
                              {formatAmount(reversal.liquidation.amount)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Variação 24h:</span>
                            <span className={`font-mono ${
                              reversal.liquidation.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {reversal.liquidation.change24h >= 0 ? '+' : ''}{reversal.liquidation.change24h.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Market Cap:</span>
                            <span className={`font-mono ${
                              reversal.liquidation.marketCap === 'high' ? 'text-blue-400' : 'text-gray-300'
                            }`}>
                              {reversal.liquidation.marketCap.toUpperCase()}
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
                <Zap className="w-12 h-12 text-gray-500 mx-auto" />
                <h4 className="text-lg font-medium text-gray-400 font-mono">AGUARDANDO SINAIS</h4>
                <p className="text-gray-500 text-sm">Nenhuma reversão detectada no momento</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>🔍 Procurando por liquidações intensas (≥3/5)</p>
                  <p>📊 Variações significativas (≥5%)</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
