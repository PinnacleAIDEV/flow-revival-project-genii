
import React from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { LiquidationBubble } from '../../types/liquidation';
import { formatAmount } from '../../utils/liquidationUtils';

interface LiquidationStatsProps {
  longLiquidations: LiquidationBubble[];
  shortLiquidations: LiquidationBubble[];
}

export const LiquidationStats: React.FC<LiquidationStatsProps> = ({
  longLiquidations,
  shortLiquidations
}) => {
  // Calcular valores atuais (não acumulados)
  const totalLongAmount = longLiquidations.reduce((sum, liq) => sum + liq.amount, 0);
  const totalShortAmount = shortLiquidations.reduce((sum, liq) => sum + liq.amount, 0);
  
  // Calcular por market cap
  const longHighCap = longLiquidations.filter(liq => liq.marketCap === 'high');
  const longLowCap = longLiquidations.filter(liq => liq.marketCap === 'low');
  const shortHighCap = shortLiquidations.filter(liq => liq.marketCap === 'high');
  const shortLowCap = shortLiquidations.filter(liq => liq.marketCap === 'low');

  const longHighCapAmount = longHighCap.reduce((sum, liq) => sum + liq.amount, 0);
  const longLowCapAmount = longLowCap.reduce((sum, liq) => sum + liq.amount, 0);
  const shortHighCapAmount = shortHighCap.reduce((sum, liq) => sum + liq.amount, 0);
  const shortLowCapAmount = shortLowCap.reduce((sum, liq) => sum + liq.amount, 0);

  const StatCard = ({ 
    title, 
    value, 
    count, 
    color, 
    icon: Icon,
    highCap,
    lowCap,
    highCapAmount,
    lowCapAmount
  }: {
    title: string;
    value: number;
    count: number;
    color: string;
    icon: React.ElementType;
    highCap: number;
    lowCap: number;
    highCapAmount: number;
    lowCapAmount: number;
  }) => (
    <div className={`p-4 rounded-lg border-l-4 ${color} bg-gray-50`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
        </div>
        <span className="text-xs bg-white px-2 py-1 rounded font-mono">{count} ativos</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">{formatAmount(value)}</span>
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">🏢 High Cap:</span>
            <div className="text-right">
              <div className="font-mono text-gray-900">{formatAmount(highCapAmount)}</div>
              <div className="text-gray-500">({highCap} ativos)</div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">🚀 Low Cap:</span>
            <div className="text-right">
              <div className="font-mono text-gray-900">{formatAmount(lowCapAmount)}</div>
              <div className="text-gray-500">({lowCap} ativos)</div>
            </div>
          </div>
        </div>
        
        {/* Indicador de balanceamento */}
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              Balance: {highCap > 0 && lowCap > 0 ? '✅ Equilibrado' : '⚠️ Desequilibrado'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Long Liquidations"
          value={totalLongAmount}
          count={longLiquidations.length}
          color="border-red-500"
          icon={TrendingDown}
          highCap={longHighCap.length}
          lowCap={longLowCap.length}
          highCapAmount={longHighCapAmount}
          lowCapAmount={longLowCapAmount}
        />
        
        <StatCard
          title="Short Liquidations"
          value={totalShortAmount}
          count={shortLiquidations.length}
          color="border-green-500"
          icon={TrendingUp}
          highCap={shortHighCap.length}
          lowCap={shortLowCap.length}
          highCapAmount={shortHighCapAmount}
          lowCapAmount={shortLowCapAmount}
        />
        
        <div className="p-4 rounded-lg border-l-4 border-blue-500 bg-gray-50">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-900 text-sm">Balance Overview</h3>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Liquidação Atual:</span>
              <span className="font-mono font-bold">{formatAmount(totalLongAmount + totalShortAmount)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Long vs Short:</span>
              <span className="font-mono">{longLiquidations.length}:{shortLiquidations.length}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">High Cap Total:</span>
              <span className="font-mono">{longHighCap.length + shortHighCap.length} ativos</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Low Cap Total:</span>
              <span className="font-mono">{longLowCap.length + shortLowCap.length} ativos</span>
            </div>
            
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-1">
                {(longHighCap.length > 0 && longLowCap.length > 0 && shortHighCap.length > 0 && shortLowCap.length > 0) ? (
                  <>
                    <span className="text-green-600">✅</span>
                    <span className="text-green-600 font-medium">Sistema Equilibrado</span>
                  </>
                ) : (
                  <>
                    <span className="text-yellow-600">⚠️</span>
                    <span className="text-yellow-600 font-medium">Aguardando Balance</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
