import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Database, RefreshCw, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

interface VolumeData {
  id: string;
  symbol: string;
  volume: number;
  volumeSpike: number;
  price: number;
  change24h: number;
  exchange: string;
  timestamp: string;
}

const UnusualVolume: React.FC = () => {
  const navigate = useNavigate();
  const [spotVolume, setSpotVolume] = useState<VolumeData[]>([]);
  const [futuresVolume, setFuturesVolume] = useState<VolumeData[]>([]);
  const [microcaps, setMicrocaps] = useState<VolumeData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  // Simulate data generation
  const generateVolumeData = (type: 'spot' | 'futures' | 'microcap', count: number): VolumeData[] => {
    const symbols = type === 'microcap' 
      ? ['PEPE', 'SHIB', 'DOGE', 'WIF', 'BONK', 'FLOKI', 'MEME', 'WOJAK', 'TURBO', 'LADYS']
      : ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'AVAX', 'DOT', 'MATIC', 'UNI', 'LINK', 'LTC', 'BCH', 'XLM', 'VET'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `${type}-${i}`,
      symbol: symbols[i % symbols.length] + (type === 'futures' ? '-PERP' : ''),
      volume: Math.random() * 1000000000,
      volumeSpike: 3 + Math.random() * 20,
      price: type === 'microcap' ? Math.random() * 1 : Math.random() * 100000,
      change24h: (Math.random() - 0.5) * 30,
      exchange: Math.random() > 0.5 ? 'Binance' : 'OKX',
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString() // Último 1 hora
    })).sort((a, b) => b.volumeSpike - a.volumeSpike);
  };

  const fetchData = async () => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSpotVolume(generateVolumeData('spot', 20));
    setFuturesVolume(generateVolumeData('futures', 20));
    setMicrocaps(generateVolumeData('microcap', 20));
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 3 minutes
    const interval = setInterval(fetchData, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
    // Analisa direção baseada em múltiplos fatores
    const priceMovement = item.change24h;
    const volumeSpike = item.volumeSpike;
    
    // Lógica para determinar se é volume comprador ou vendedor
    if (priceMovement > 1 && volumeSpike > 4) {
      return { direction: 'Volume Comprador Forte', emoji: '🟢', color: 'text-[#A6FF00]' };
    } else if (priceMovement > 0.5) {
      return { direction: 'Volume Comprador', emoji: '🔵', color: 'text-[#00E0FF]' };
    } else if (priceMovement < -1 && volumeSpike > 4) {
      return { direction: 'Volume Vendedor Forte', emoji: '🔴', color: 'text-[#FF4D4D]' };
    } else if (priceMovement < -0.5) {
      return { direction: 'Volume Vendedor', emoji: '🟠', color: 'text-[#FF8C00]' };
    } else {
      return { direction: 'Volume Neutro', emoji: '⚪', color: 'text-[#AAAAAA]' };
    }
  };

  const VolumeTable = ({ data, title }: { data: VolumeData[], title: string }) => (
    <Card className="h-full bg-[#1C1C1E] border-[#2E2E2E] hover:border-[#00E0FF]/50 transition-all duration-300 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-[#F5F5F5] font-mono">
          <TrendingUp className="w-5 h-5 text-[#00E0FF]" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[#AAAAAA] uppercase bg-[#0A0A0A] border-b border-[#2E2E2E]">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">Symbol</th>
                <th className="py-3 px-4 text-right font-semibold">Volume Spike</th>
                <th className="py-3 px-4 text-right font-semibold">Volume</th>
                <th className="py-3 px-4 text-right font-semibold">Price</th>
                <th className="py-3 px-4 text-right font-semibold">24h Change</th>
                <th className="py-3 px-4 text-center font-semibold">Exchange</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {data.map((item) => {
                const { time, date } = formatDateTime(item.timestamp);
                const timeAgo = getTimeAgo(item.timestamp);
                const volumeInfo = getVolumeDirection(item);
                
                return (
                  <TooltipProvider key={item.id}>
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
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1C1C1E] to-[#0A0A0A]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="p-4 border-b border-[#2E2E2E] bg-[#1C1C1E]/90 backdrop-blur-md rounded-t-2xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 border-[#2E2E2E] text-[#AAAAAA] hover:bg-[#2E2E2E] hover:border-[#00E0FF] hover:text-[#F5F5F5]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>VOLTAR</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[#00E0FF] to-[#A6FF00] rounded-lg flex items-center justify-center relative">
                  <Eye className="w-5 h-5 text-black" />
                  <div className="absolute inset-0 bg-[#00E0FF]/20 rounded-lg animate-pulse"></div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#F5F5F5] font-mono">UNUSUAL VOLUME MONITOR 💥</h2>
                  <div className="flex items-center space-x-4 text-sm text-[#AAAAAA]">
                    <span>Rastreando spikes de volume 3x+ • Auto-refresh a cada 3 minutos</span>
                    <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={fetchData}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2 border-[#2E2E2E] text-[#AAAAAA] hover:bg-[#2E2E2E] hover:border-[#00E0FF] hover:text-[#F5F5F5]"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>REFRESH</span>
              </Button>
              <Button
                onClick={() => navigate('/database')}
                variant="outline"
                className="flex items-center space-x-2 border-[#2E2E2E] text-[#AAAAAA] hover:bg-[#2E2E2E] hover:border-[#00E0FF] hover:text-[#F5F5F5]"
              >
                <Database className="w-4 h-4" />
                <span>DATABASE</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Volume Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <VolumeTable data={spotVolume} title="SPOT UNUSUAL VOLUME" />
          <VolumeTable data={futuresVolume} title="FUTURES UNUSUAL VOLUME" />
        </div>

        {/* Microcaps */}
        <VolumeTable data={microcaps} title="MICROCAP NOTABLE VOLUME" />
      </div>
    </div>
  );
};

export default UnusualVolume;
