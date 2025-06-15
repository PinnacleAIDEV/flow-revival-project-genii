
import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Database, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

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
      timestamp: new Date().toISOString()
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

  const VolumeTable = ({ data, title }: { data: VolumeData[], title: string }) => (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">Symbol</th>
                <th className="py-3 px-4 text-right font-semibold">Volume Spike</th>
                <th className="py-3 px-4 text-right font-semibold">Volume</th>
                <th className="py-3 px-4 text-right font-semibold">Price</th>
                <th className="py-3 px-4 text-right font-semibold">24h Change</th>
                <th className="py-3 px-4 text-center font-semibold">Exchange</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-gray-900">{item.symbol}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant="destructive" className="font-mono">
                      {item.volumeSpike.toFixed(1)}x
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-mono text-gray-900">{formatVolume(item.volume)}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-mono text-gray-700">{formatPrice(item.price)}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-mono ${item.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{item.exchange}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white rounded-t-2xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-600 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Unusual Volume Monitor</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Tracking 3x+ volume spikes • Auto-refresh every 3 minutes</span>
                    <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={fetchData}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button
                onClick={() => navigate('/database')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Database className="w-4 h-4" />
                <span>Database</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Volume Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <VolumeTable data={spotVolume} title="Spot Unusual Volume" />
          <VolumeTable data={futuresVolume} title="Futures Unusual Volume" />
        </div>

        {/* Microcaps */}
        <VolumeTable data={microcaps} title="Microcap Notable Volume" />
      </div>
    </div>
  );
};

export default UnusualVolume;
