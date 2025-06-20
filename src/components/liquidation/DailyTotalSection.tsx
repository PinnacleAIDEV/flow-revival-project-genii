
import React from 'react';
import { Clock, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { DailyLiquidationTotal } from '../../hooks/use24hLiquidationData';
import { formatAmount } from '../../utils/liquidationUtils';

interface DailyTotalSectionProps {
  dailyTotals: DailyLiquidationTotal[];
  stats: {
    totalAssets: number;
    totalLiquidated: number;
    totalLongLiquidated: number;
    totalShortLiquidated: number;
    highCapAssets: number;
    lowCapAssets: number;
  };
  timeUntilReset: string;
  lastUpdateTime: Date;
  onAssetClick: (asset: string) => void;
}

export const DailyTotalSection: React.FC<DailyTotalSectionProps> = ({
  dailyTotals,
  stats,
  timeUntilReset,
  lastUpdateTime,
  onAssetClick
}) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="mt-6 bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-lg border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white font-mono">TOTAL LIQUIDATED 24H</h3>
              <p className="text-white/80 text-sm">Acumulado desde 00:00 UTC • Atualiza a cada 3min</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-white/90 text-sm">
              <Clock className="w-4 h-4" />
              <span>Reset em: {timeUntilReset}</span>
            </div>
            <div className="text-white/70 text-xs mt-1">
              Última atualização: {formatTime(lastUpdateTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 bg-gray-800/50 border-b border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{stats.totalAssets}</div>
            <div className="text-xs text-gray-400">Assets Únicos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{formatAmount(stats.totalLiquidated)}</div>
            <div className="text-xs text-gray-400">Total Liquidado</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{formatAmount(stats.totalLongLiquidated)}</div>
            <div className="text-xs text-gray-400">Long Liquidado</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{formatAmount(stats.totalShortLiquidated)}</div>
            <div className="text-xs text-gray-400">Short Liquidado</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-4">
        {dailyTotals.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-900/95 z-10">
                <TableRow className="hover:bg-gray-800/50 border-gray-700">
                  <TableHead className="font-bold text-cyan-400 font-mono">ASSET</TableHead>
                  <TableHead className="font-bold text-cyan-400 font-mono">LONG 24H</TableHead>
                  <TableHead className="font-bold text-cyan-400 font-mono">SHORT 24H</TableHead>
                  <TableHead className="font-bold text-cyan-400 font-mono">TOTAL 24H</TableHead>
                  <TableHead className="font-bold text-cyan-400 font-mono">CAP</TableHead>
                  <TableHead className="font-bold text-cyan-400 font-mono">ÚLTIMA ATZ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyTotals.map((item, index) => (
                  <TableRow 
                    key={item.asset} 
                    className={`hover:bg-gray-800/30 border-gray-700 ${index % 2 === 0 ? 'bg-gray-900/30' : 'bg-gray-800/20'}`}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          item.longTotal > item.shortTotal ? 'bg-red-500' : 'bg-green-500'
                        }`}></div>
                        <button
                          onClick={() => onAssetClick(item.asset)}
                          className="text-white hover:text-cyan-400 font-bold cursor-pointer hover:underline"
                        >
                          {item.asset}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="w-3 h-3 text-red-400" />
                        <span className="font-mono text-red-400 font-semibold">
                          {formatAmount(item.longTotal)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        <span className="font-mono text-green-400 font-semibold">
                          {formatAmount(item.shortTotal)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-yellow-400 font-bold text-lg">
                        {formatAmount(item.totalLiquidated)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.marketCap === 'high' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.marketCap === 'high' ? 'HIGH' : 'LOW'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-400 text-xs font-mono">
                        {formatTime(item.lastUpdate)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-center">
            <div className="space-y-4">
              <BarChart3 className="w-16 h-16 text-gray-500 mx-auto" />
              <div>
                <h4 className="text-lg font-medium text-gray-400 font-mono">AGUARDANDO DADOS 24H</h4>
                <p className="text-gray-500 text-sm">Liquidações serão acumuladas a partir de 00:00 UTC</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
