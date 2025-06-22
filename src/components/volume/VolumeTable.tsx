
import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { VolumeRow } from './VolumeRow';

interface VolumeData {
  id: string;
  symbol: string;
  volume: number;
  volumeSpike: number;
  price: number;
  change24h: number;
  exchange: string;
  timestamp: string;
  ticker: string;
  trades_count: number;
  type?: string;
  strength?: number;
  priceMovement?: number;
}

interface VolumeTableProps {
  data: VolumeData[];
  title: string;
}

export const VolumeTable: React.FC<VolumeTableProps> = ({ data, title }) => {
  const getTypeColor = (type?: string) => {
    if (!type) return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    
    switch (type) {
      case 'spot_buy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'spot_sell':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'futures_long':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'futures_short':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeLabel = (type?: string) => {
    if (!type) return 'UNKNOWN';
    
    switch (type) {
      case 'spot_buy': return 'SPOT BUY';
      case 'spot_sell': return 'SPOT SELL';
      case 'futures_long': return 'FUTURES LONG';
      case 'futures_short': return 'FUTURES SHORT';
      default: return type.toUpperCase();
    }
  };

  return (
    <Card className="h-full bg-[#1C1C1E] border-[#2E2E2E] hover:border-[#00E0FF]/50 transition-all duration-300 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-[#F5F5F5] font-mono">
          <Activity className="w-5 h-5 text-[#00E0FF]" />
          <span>{title}</span>
          <Badge className="bg-[#00E0FF]/20 text-[#00E0FF] border-[#00E0FF]/30">
            {data.length} klines
          </Badge>
          <Badge className="bg-[#A6FF00]/20 text-[#A6FF00] border-[#A6FF00]/30 text-xs">
            3MIN TIMEFRAME
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[#AAAAAA] uppercase bg-[#0A0A0A] border-b border-[#2E2E2E]">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">Asset</th>
                <th className="py-3 px-4 text-center font-semibold">Type</th>
                <th className="py-3 px-4 text-right font-semibold">Volume Spike</th>
                <th className="py-3 px-4 text-right font-semibold">Kline Volume</th>
                <th className="py-3 px-4 text-right font-semibold">Price</th>
                <th className="py-3 px-4 text-right font-semibold">Price Move</th>
                <th className="py-3 px-4 text-center font-semibold">Strength</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {data.length > 0 ? data.map((item, index) => (
                <tr key={item.id} className="hover:bg-[#2E2E2E]/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#F5F5F5] font-mono">{item.symbol}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={`${getTypeColor(item.type)} text-xs font-mono`}>
                      {getTypeLabel(item.type)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge className="bg-[#FF4D4D] hover:bg-[#FF4D4D]/80 text-black font-mono">
                      {item.volumeSpike.toFixed(1)}x
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-mono text-[#F5F5F5]">
                      {item.volume >= 1e6 ? `${(item.volume / 1e6).toFixed(2)}M` : 
                       item.volume >= 1e3 ? `${(item.volume / 1e3).toFixed(1)}K` : 
                       item.volume.toFixed(0)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-mono text-[#AAAAAA]">
                      ${item.price >= 1000 ? item.price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : 
                        item.price >= 1 ? item.price.toFixed(4) : item.price.toFixed(6)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-mono ${(item.priceMovement || 0) >= 0 ? 'text-[#A6FF00]' : 'text-[#FF4D4D]'}`}>
                      {(item.priceMovement || 0) >= 0 ? '+' : ''}{(item.priceMovement || 0).toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className={`w-2 h-2 rounded-full mx-auto ${
                      (item.strength || 0) >= 4 ? 'bg-red-500' :
                      (item.strength || 0) >= 3 ? 'bg-orange-500' :
                      (item.strength || 0) >= 2 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} title={`Strength: ${item.strength || 1}`} />
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#AAAAAA]">
                    <div className="flex flex-col items-center space-y-2">
                      <Activity className="w-8 h-8 text-[#00E0FF]/50" />
                      <span>Analisando klines de 3 minutos...</span>
                      <span className="text-xs">Detectando volume 3x+ acima da média</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
