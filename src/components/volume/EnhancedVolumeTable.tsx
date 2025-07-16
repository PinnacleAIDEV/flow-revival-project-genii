import React, { useState } from 'react';
import { TrendingUp, Activity, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

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

interface EnhancedVolumeTableProps {
  data: VolumeData[];
  title: string;
}

type SortField = 'volumeSpike' | 'volume' | 'priceMovement' | 'timestamp' | 'strength';
type SortDirection = 'asc' | 'desc';

export const EnhancedVolumeTable: React.FC<EnhancedVolumeTableProps> = ({ data, title }) => {
  const [sortField, setSortField] = useState<SortField>('volumeSpike');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<string>('all');

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredData = data.filter(item => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortField) {
      case 'volumeSpike':
        aValue = a.volumeSpike;
        bValue = b.volumeSpike;
        break;
      case 'volume':
        aValue = a.volume;
        bValue = b.volume;
        break;
      case 'priceMovement':
        aValue = a.priceMovement || 0;
        bValue = b.priceMovement || 0;
        break;
      case 'strength':
        aValue = a.strength || 0;
        bValue = b.strength || 0;
        break;
      case 'timestamp':
        aValue = new Date(a.timestamp).getTime();
        bValue = new Date(b.timestamp).getTime();
        break;
      default:
        return 0;
    }

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const uniqueTypes = [...new Set(data.map(item => item.type).filter(Boolean))];

  return (
    <Card className="h-full bg-[#1C1C1E] border-[#2E2E2E] hover:border-[#00E0FF]/50 transition-all duration-300 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-[#F5F5F5] font-mono">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-[#00E0FF]" />
            <span>{title}</span>
            <Badge className="bg-[#00E0FF]/20 text-[#00E0FF] border-[#00E0FF]/30">
              {sortedData.length} klines
            </Badge>
          </div>
          
          {/* Filtros */}
          <div className="flex items-center space-x-2">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#2E2E2E] border border-[#404040] text-[#F5F5F5] text-xs rounded px-2 py-1"
            >
              <option value="all">ALL TYPES</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{getTypeLabel(type)}</option>
              ))}
            </select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[#AAAAAA] uppercase bg-[#0A0A0A] border-b border-[#2E2E2E] sticky top-0">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">Asset</th>
                <th className="py-3 px-4 text-center font-semibold">Type</th>
                <th className="py-3 px-4 text-right font-semibold cursor-pointer hover:text-[#00E0FF]" 
                    onClick={() => handleSort('volumeSpike')}>
                  Volume Spike {sortField === 'volumeSpike' && (
                    sortDirection === 'asc' ? <SortAsc className="inline w-3 h-3" /> : <SortDesc className="inline w-3 h-3" />
                  )}
                </th>
                <th className="py-3 px-4 text-right font-semibold cursor-pointer hover:text-[#00E0FF]" 
                    onClick={() => handleSort('volume')}>
                  Volume {sortField === 'volume' && (
                    sortDirection === 'asc' ? <SortAsc className="inline w-3 h-3" /> : <SortDesc className="inline w-3 h-3" />
                  )}
                </th>
                <th className="py-3 px-4 text-right font-semibold">Price</th>
                <th className="py-3 px-4 text-right font-semibold cursor-pointer hover:text-[#00E0FF]" 
                    onClick={() => handleSort('priceMovement')}>
                  Price Move {sortField === 'priceMovement' && (
                    sortDirection === 'asc' ? <SortAsc className="inline w-3 h-3" /> : <SortDesc className="inline w-3 h-3" />
                  )}
                </th>
                <th className="py-3 px-4 text-center font-semibold cursor-pointer hover:text-[#00E0FF]" 
                    onClick={() => handleSort('strength')}>
                  Strength {sortField === 'strength' && (
                    sortDirection === 'asc' ? <SortAsc className="inline w-3 h-3" /> : <SortDesc className="inline w-3 h-3" />
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {sortedData.length > 0 ? sortedData.map((item, index) => (
                <tr key={item.id} className="hover:bg-[#2E2E2E]/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#F5F5F5] font-mono">{item.symbol}</span>
                      <span className="text-[#666] text-xs">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={`${getTypeColor(item.type)} text-xs font-mono`}>
                      {getTypeLabel(item.type)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge className={`font-mono text-black ${
                      item.volumeSpike >= 10 ? 'bg-[#FF0000]' :
                      item.volumeSpike >= 7 ? 'bg-[#FF4D4D]' :
                      item.volumeSpike >= 5 ? 'bg-[#FF8800]' : 'bg-[#FFAA00]'
                    }`}>
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
                    <div className={`w-3 h-3 rounded-full mx-auto flex items-center justify-center text-xs font-bold text-black ${
                      (item.strength || 0) >= 4 ? 'bg-red-500' :
                      (item.strength || 0) >= 3 ? 'bg-orange-500' :
                      (item.strength || 0) >= 2 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} title={`Strength: ${item.strength || 1}`}>
                      {item.strength || 1}
                    </div>
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