
import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Database, RefreshCw, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { useRealFlowData } from '../hooks/useRealFlowData';
import { useSupabaseStorage } from '../hooks/useSupabaseStorage';

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

const UnusualVolume: React.FC = () => {
  const navigate = useNavigate();
  const { flowData } = useRealFlowData();
  const { liquidations, coinTrends } = useSupabaseStorage();
  
  const [spotVolume, setSpotVolume] = useState<VolumeData[]>([]);
  const [futuresVolume, setFuturesVolume] = useState<VolumeData[]>([]);
  const [microcaps, setMicrocaps] = useState<VolumeData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  // High market cap assets for classification
  const highMarketCapAssets = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 
    'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'ATOMUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'VETUSDT',
    'FILUSDT', 'TRXUSDT', 'ETCUSDT', 'NEOUSDT', 'ALGOUSDT', 'MANAUSDT', 'SANDUSDT', 'AXSUSDT',
    'APEUSDT', 'CHZUSDT', 'GALAUSDT', 'ENJUSDT', 'NEARUSDT', 'QNTUSDT', 'FLOWUSDT', 'ICPUSDT',
    'THETAUSDT', 'XTZUSDT', 'MKRUSDT', 'FTMUSDT', 'AAVEUSDT', 'SNXUSDT', 'CRVUSDT', 'COMPUSDT',
    'UNIUSDT', 'SUSHIUSDT', 'YFIUSDT', 'ZRXUSDT', 'BATUSDT', 'RENUSDT', 'KNCUSDT', 'LRCUSDT'
  ];

  // Microcap assets for classification
  const microcapAssets = [
    'PEPEUSDT', 'SHIBUSDT', 'WIFUSDT', 'BONKUSDT', 'FLOKIUSDT', 'MEMEUSDT', 'TURBOUSDT',
    '1000RATSUSDT', 'ORDIUSDT', '1000SATSUSDT', 'BOMEUSDT', 'JUPUSDT', 'WUSDT'
  ];

  const processRealData = () => {
    if (!flowData || flowData.length === 0) return;

    setLoading(true);
    const now = new Date();
    
    // Process flow data for unusual volume detection
    const processedData: VolumeData[] = flowData
      .filter(data => {
        const volumeValue = data.volume * data.price;
        const priceChange = Math.abs(data.change_24h || 0);
        
        // Enhanced volume spike detection
        const baseVolumeThreshold = highMarketCapAssets.includes(data.ticker) ? 50000 : 15000;
        const volumeSpike = volumeValue / baseVolumeThreshold;
        
        return volumeSpike >= 3.0 && priceChange >= 0.5; // 3x volume spike + 0.5% price movement
      })
      .map(data => {
        const volumeValue = data.volume * data.price;
        const baseVolumeThreshold = highMarketCapAssets.includes(data.ticker) ? 50000 : 15000;
        const volumeSpike = volumeValue / baseVolumeThreshold;
        
        return {
          id: `${data.ticker}-${data.timestamp || Date.now()}`,
          symbol: data.ticker.replace('USDT', ''),
          volume: volumeValue,
          volumeSpike: volumeSpike,
          price: data.price,
          change24h: data.change_24h || 0,
          exchange: 'Binance',
          timestamp: new Date(data.timestamp || Date.now()).toISOString(),
          ticker: data.ticker,
          trades_count: data.trades_count || 0
        };
      })
      .sort((a, b) => b.volumeSpike - a.volumeSpike);

    // Categorize data
    const futures = processedData.filter(item => 
      !microcapAssets.includes(item.ticker) && 
      (item.volumeSpike >= 4.0 || item.volume >= 100000)
    ).slice(0, 20);
    
    const spot = processedData.filter(item => 
      highMarketCapAssets.includes(item.ticker) && 
      item.volumeSpike >= 3.0
    ).slice(0, 20);
    
    const microcap = processedData.filter(item => 
      microcapAssets.includes(item.ticker) || 
      (!highMarketCapAssets.includes(item.ticker) && item.volume < 100000)
    ).slice(0, 20);

    setFuturesVolume(futures);
    setSpotVolume(spot);
    setMicrocaps(microcap);
    setLastUpdate(now);
    setLoading(false);

    console.log(`📊 Unusual Volume Updated: Spot=${spot.length}, Futures=${futures.length}, Microcaps=${microcap.length}`);
  };

  // Process real data when flowData changes
  useEffect(() => {
    processRealData();
  }, [flowData]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      processRealData();
    }, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [flowData]);

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

  const VolumeTable = ({ data, title }: { data: VolumeData[], title: string }) => (
    <Card className="h-full bg-[#1C1C1E] border-[#2E2E2E] hover:border-[#00E0FF]/50 transition-all duration-300 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-[#F5F5F5] font-mono">
          <TrendingUp className="w-5 h-5 text-[#00E0FF]" />
          <span>{title}</span>
          <Badge className="bg-[#00E0FF]/20 text-[#00E0FF] border-[#00E0FF]/30">
            {data.length} assets
          </Badge>
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
              {data.length > 0 ? data.map((item) => {
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
              }) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#AAAAAA]">
                    <div className="flex flex-col items-center space-y-2">
                      <TrendingUp className="w-8 h-8 text-[#00E0FF]/50" />
                      <span>Monitorando volume anormal...</span>
                      <span className="text-xs">Aguardando spikes de 3x+</span>
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
                    <span>Rastreando spikes de volume 3x+ em tempo real</span>
                    <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      LIVE DATA
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={processRealData}
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
