
import React from 'react';
import { Calculator, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { LiquidationBubble } from '../../types/liquidation';
import { formatAmount } from '../../utils/liquidationUtils';

interface LiveTotalSectionProps {
  longLiquidations: LiquidationBubble[];
  shortLiquidations: LiquidationBubble[];
}

export const LiveTotalSection: React.FC<LiveTotalSectionProps> = ({
  longLiquidations,
  shortLiquidations
}) => {
  // Calcular totais em tempo real
  const totalLongAmount = longLiquidations.reduce((sum, liq) => sum + liq.amount, 0);
  const totalShortAmount = shortLiquidations.reduce((sum, liq) => sum + liq.amount, 0);
  const grandTotal = totalLongAmount + totalShortAmount;
  
  // Calcular por market cap
  const longHighCap = longLiquidations.filter(liq => liq.marketCap === 'high');
  const longLowCap = longLiquidations.filter(liq => liq.marketCap === 'low');
  const shortHighCap = shortLiquidations.filter(liq => liq.marketCap === 'high');
  const shortLowCap = shortLiquidations.filter(liq => liq.marketCap === 'low');

  const longHighCapAmount = longHighCap.reduce((sum, liq) => sum + liq.amount, 0);
  const longLowCapAmount = longLowCap.reduce((sum, liq) => sum + liq.amount, 0);
  const shortHighCapAmount = shortHighCap.reduce((sum, liq) => sum + liq.amount, 0);
  const shortLowCapAmount = shortLowCap.reduce((sum, liq) => sum + liq.amount, 0);

  // Determinar tendência dominante
  const dominantType = totalLongAmount > totalShortAmount ? 'long' : 'short';
  const dominantPercentage = grandTotal > 0 ? ((dominantType === 'long' ? totalLongAmount : totalShortAmount) / grandTotal * 100) : 0;

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
      <Card className="bg-gray-900/90 backdrop-blur-sm border-yellow-500 h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2 text-yellow-400 font-mono">
                  <span>TOTAL LIQUIDATED (LIVE)</span>
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                    {longLiquidations.length + shortLiquidations.length} ativos
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-400 font-mono">
                  Valores atuais das liquidações ativas no momento
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 h-[calc(100%-7rem)]">
          {/* Total Geral */}
          <div className="mb-6 text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-2">
              {formatAmount(grandTotal)}
            </div>
            <div className="text-sm text-gray-400">
              Total Liquidado Atual
            </div>
            {dominantPercentage > 60 && (
              <div className="mt-2">
                <Badge className={`${dominantType === 'long' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                  {dominantPercentage.toFixed(1)}% {dominantType.toUpperCase()} DOMINANTE
                </Badge>
              </div>
            )}
          </div>

          {/* Grid de Totais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Long Liquidations */}
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-red-400 font-mono">LONG LIQUIDATIONS</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300 text-sm">Total:</span>
                  <span className="text-2xl font-bold text-red-400">{formatAmount(totalLongAmount)}</span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Ativos:</span>
                  <span className="text-red-300">{longLiquidations.length}</span>
                </div>
                
                <div className="border-t border-red-500/30 pt-2 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">🏢 High Cap:</span>
                    <span className="text-red-300">{formatAmount(longHighCapAmount)} ({longHighCap.length})</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">🚀 Low Cap:</span>
                    <span className="text-red-300">{formatAmount(longLowCapAmount)} ({longLowCap.length})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Short Liquidations */}
            <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="font-bold text-green-400 font-mono">SHORT LIQUIDATIONS</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300 text-sm">Total:</span>
                  <span className="text-2xl font-bold text-green-400">{formatAmount(totalShortAmount)}</span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Ativos:</span>
                  <span className="text-green-300">{shortLiquidations.length}</span>
                </div>
                
                <div className="border-t border-green-500/30 pt-2 mt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">🏢 High Cap:</span>
                    <span className="text-green-300">{formatAmount(shortHighCapAmount)} ({shortHighCap.length})</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">🚀 Low Cap:</span>
                    <span className="text-green-300">{formatAmount(shortLowCapAmount)} ({shortLowCap.length})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Ativos Liquidados */}
          <div className="bg-gray-800/50 rounded-lg p-4 h-[300px]">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h4 className="font-bold text-yellow-400 text-sm">ATIVOS LIQUIDADOS</h4>
            </div>
            
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {/* Long Liquidations */}
                {longLiquidations.slice(0, 10).map((liq, index) => (
                  <div key={`long-${liq.id}`} className="flex items-center justify-between p-2 rounded bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="w-3 h-3 text-red-400" />
                      <span className="text-red-300 font-mono text-xs font-bold">{liq.asset}</span>
                      <Badge className="bg-red-500/20 text-red-300 text-xs">LONG</Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-red-400 font-mono text-xs">{formatAmount(liq.amount)}</div>
                      <div className="text-gray-500 text-xs">{formatTimestamp(liq.timestamp)}</div>
                    </div>
                  </div>
                ))}
                
                {/* Short Liquidations */}
                {shortLiquidations.slice(0, 10).map((liq, index) => (
                  <div key={`short-${liq.id}`} className="flex items-center justify-between p-2 rounded bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-green-300 font-mono text-xs font-bold">{liq.asset}</span>
                      <Badge className="bg-green-500/20 text-green-300 text-xs">SHORT</Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-mono text-xs">{formatAmount(liq.amount)}</div>
                      <div className="text-gray-500 text-xs">{formatTimestamp(liq.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
