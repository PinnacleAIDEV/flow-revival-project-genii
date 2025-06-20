
import React from 'react';
import { TableCell, TableRow } from '../ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface LiquidationBubble {
  id: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  marketCap: 'high' | 'low';
  timestamp: Date;
  intensity: number;
  change24h: number;
  volume: number;
  lastUpdateTime: Date;
  totalLiquidated: number;
}

interface LiquidationRowProps {
  liquidation: LiquidationBubble;
  index: number;
  textColor: string;
  onAssetClick: (asset: string) => void;
}

export const LiquidationRow: React.FC<LiquidationRowProps> = ({
  liquidation,
  index,
  textColor,
  onAssetClick
}) => {
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

  const formatChange = (change: number) => {
    if (change === undefined || change === null || isNaN(change)) return '0.00%';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const formatTimestamp = (timestamp: Date) => {
    try {
      // Verificar se timestamp é válido
      if (!timestamp || !(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
        return '--:--:--';
      }
      
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }).format(timestamp);
    } catch (error) {
      console.error('Erro ao formatar timestamp:', error, timestamp);
      return '--:--:--';
    }
  };

  const getIntensityColor = (intensity: number) => {
    const colors = {
      1: 'bg-gray-100 text-gray-700',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-orange-100 text-orange-800',
      4: 'bg-red-100 text-red-800',
      5: 'bg-red-200 text-red-900'
    };
    return colors[intensity as keyof typeof colors] || colors[1];
  };

  const getIntensityText = (intensity: number) => {
    const texts = {
      1: 'Baixa',
      2: 'Moderada',
      3: 'Alta',
      4: 'Muito Alta',
      5: 'Extrema'
    };
    return texts[intensity as keyof typeof texts] || 'Baixa';
  };

  return (
    <TableRow className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
      <TableCell className="font-bold">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${liquidation.type === 'long' ? 'bg-red-500' : 'bg-green-500'}`}></div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onAssetClick(liquidation.asset)}
                  className={`${textColor} hover:underline cursor-pointer font-bold text-sm`}
                >
                  {liquidation.asset}
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700 max-w-xs">
                <div className="space-y-2">
                  <div className="font-bold text-cyan-400 border-b border-gray-700 pb-1">
                    🔥 {liquidation.asset} - {liquidation.type.toUpperCase()} LIQUIDATION
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">⏰ Detectado:</span>
                      <span className="text-white font-mono">{formatTimestamp(liquidation.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">💰 Valor Atual:</span>
                      <span className="text-yellow-400 font-bold">{formatAmount(liquidation.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">💲 Preço Atual:</span>
                      <span className="text-white font-mono">{formatPrice(liquidation.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">📊 Variação 24h:</span>
                      <span className={`font-bold ${liquidation.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatChange(liquidation.change24h)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">🏭 Market Cap:</span>
                      <span className={`font-bold ${liquidation.marketCap === 'high' ? 'text-blue-400' : 'text-gray-300'}`}>
                        {liquidation.marketCap === 'high' ? 'HIGH CAP' : 'LOW CAP'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">⚡ Intensidade:</span>
                      <span className="text-orange-400 font-bold">
                        {getIntensityText(liquidation.intensity)} ({liquidation.intensity}/5)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">📈 Volume:</span>
                      <span className="text-purple-400 font-mono">
                        {liquidation.volume.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-gray-700 pt-1 mt-2">
                      <div className="text-xs text-cyan-400">
                        💡 Ordenado por relevância atual, não acumulada
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 border-t border-gray-700 pt-1 mt-2">
                    Clique para selecionar o ativo
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs">
        {formatPrice(liquidation.price)}
      </TableCell>
      <TableCell>
        <span className={`font-semibold text-xs ${liquidation.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatChange(liquidation.change24h)}
        </span>
      </TableCell>
      <TableCell className="font-mono text-xs font-bold">
        {/* MUDANÇA: Mostrar amount (liquidação atual) em vez de totalLiquidated */}
        <div className="flex flex-col">
          <span className="text-yellow-600">{formatAmount(liquidation.amount)}</span>
          <span className="text-xs text-gray-500">atual</span>
        </div>
      </TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          liquidation.marketCap === 'high' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {liquidation.marketCap === 'high' ? 'HIGH' : 'LOW'}
        </span>
      </TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded text-xs font-bold ${getIntensityColor(liquidation.intensity)}`}>
          {liquidation.intensity}
        </span>
      </TableCell>
    </TableRow>
  );
};
