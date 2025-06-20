
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Badge } from '../ui/badge';

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
}

interface VolumeRowProps {
  item: VolumeData;
  index: number;
}

export const VolumeRow: React.FC<VolumeRowProps> = ({ item, index }) => {
  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
    return `$${volume.toFixed(2)}`;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
      date: date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    };
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - eventTime.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h atrás`;
  };

  const getVolumeDirection = (item: VolumeData): { direction: string; emoji: string; color: string } => {
    const priceMovement = item.change24h;
    const volumeSpike = item.volumeSpike;
    
    if (priceMovement > 1 && volumeSpike > 5) {
      return { direction: 'Volume Comprador Forte', emoji: '🟢', color: 'text-[#A6FF00]' };
    } else if (priceMovement > 0.5) {
      return { direction: 'Volume Comprador', emoji: '🔵', color: 'text-[#00E0FF]' };
    } else if (priceMovement < -1 && volumeSpike > 5) {
      return { direction: 'Volume Vendedor Forte', emoji: '🔴', color: 'text-[#FF4D4D]' };
    } else if (priceMovement < -0.5) {
      return { direction: 'Volume Vendedor', emoji: '🟠', color: 'text-[#FF8C00]' };
    } else {
      return { direction: 'Volume Neutro', emoji: '⚪', color: 'text-[#AAAAAA]' };
    }
  };

  const { time, date } = formatDateTime(item.timestamp);
  const timeAgo = getTimeAgo(item.timestamp);
  const volumeInfo = getVolumeDirection(item);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <tr className="hover:bg-[#2E2E2E]/50 transition-colors cursor-pointer">
            <td className="py-3 px-4">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#F5F5F5] font-mono">{item.symbol}</span>
                <span className="text-lg">{volumeInfo.emoji}</span>
              </div>
            </td>
            <td className="py-3 px-4 text-right">
              <Badge className="bg-[#FF4D4D] hover:bg-[#FF4D4D]/80 text-black font-mono">
                {item.volumeSpike.toFixed(1)}x
              </Badge>
            </td>
            <td className="py-3 px-4 text-right">
              <span className="font-mono text-[#F5F5F5]">{formatVolume(item.volume)}</span>
            </td>
            <td className="py-3 px-4 text-right">
              <span className="font-mono text-[#AAAAAA]">{formatPrice(item.price)}</span>
            </td>
            <td className="py-3 px-4 text-right">
              <span className={`font-mono ${item.change24h >= 0 ? 'text-[#A6FF00]' : 'text-[#FF4D4D]'}`}>
                {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
              </span>
            </td>
            <td className="py-3 px-4 text-center">
              <span className="text-xs bg-[#2E2E2E] text-[#AAAAAA] px-2 py-1 rounded">{item.exchange}</span>
            </td>
          </tr>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-[#1C1C1E] border-[#2E2E2E] text-[#F5F5F5] p-3 rounded-lg shadow-xl"
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[#00E0FF] font-mono text-sm">📊 UNUSUAL VOLUME DETECTED</span>
            </div>
            <div className="text-xs text-[#AAAAAA] space-y-1">
              <div>🕒 <span className="text-[#F5F5F5] font-mono">{time}</span> • {date}</div>
              <div>⏱️ <span className="text-[#A6FF00]">{timeAgo}</span></div>
              <div>📈 Volume: <span className="text-[#F5F5F5] font-mono">{formatVolume(item.volume)}</span></div>
              <div>🚀 Spike: <span className="text-[#FF4D4D] font-mono">{item.volumeSpike.toFixed(1)}x normal</span></div>
              <div>📊 Trades: <span className="text-[#F5F5F5] font-mono">{item.trades_count.toLocaleString()}</span></div>
              <div className="flex items-center space-x-2 pt-1 border-t border-[#2E2E2E]">
                <span>{volumeInfo.emoji}</span>
                <span className={`font-mono text-xs ${volumeInfo.color}`}>{volumeInfo.direction}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
