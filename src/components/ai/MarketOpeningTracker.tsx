import React, { useState, useEffect } from 'react';
import { Clock, Globe, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface MarketSession {
  name: string;
  region: 'Asia' | 'Europe' | 'Americas';
  timezone: string;
  openTime: string;
  closeTime: string;
  isActive: boolean;
  nextOpen: Date;
  vwapAnalysis?: {
    direction: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    volume: number;
    keyLevels: number[];
  };
}

interface VWAPSignal {
  market: string;
  timestamp: Date;
  price: number;
  vwap: number;
  signal: 'above' | 'below' | 'cross_up' | 'cross_down';
  volume: number;
  strength: number;
}

export const MarketOpeningTracker: React.FC = () => {
  const [markets, setMarkets] = useState<MarketSession[]>([]);
  const [vwapSignals, setVwapSignals] = useState<VWAPSignal[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Principais sessões de mercado globais
  const marketSessions: MarketSession[] = [
    {
      name: 'Tokyo Stock Exchange',
      region: 'Asia',
      timezone: 'JST',
      openTime: '09:00',
      closeTime: '15:00',
      isActive: false,
      nextOpen: new Date()
    },
    {
      name: 'Hong Kong Exchange',
      region: 'Asia', 
      timezone: 'HKT',
      openTime: '09:30',
      closeTime: '16:00',
      isActive: false,
      nextOpen: new Date()
    },
    {
      name: 'London Stock Exchange',
      region: 'Europe',
      timezone: 'GMT',
      openTime: '08:00',
      closeTime: '16:30',
      isActive: false,
      nextOpen: new Date()
    },
    {
      name: 'NYSE',
      region: 'Americas',
      timezone: 'EST',
      openTime: '09:30',
      closeTime: '16:00',
      isActive: false,
      nextOpen: new Date()
    },
    {
      name: 'NASDAQ',
      region: 'Americas',
      timezone: 'EST', 
      openTime: '09:30',
      closeTime: '16:00',
      isActive: false,
      nextOpen: new Date()
    }
  ];

  // Simular análise VWAP (em produção conectaria com dados reais)
  const generateVWAPAnalysis = (market: MarketSession) => {
    const directions: ('bullish' | 'bearish' | 'neutral')[] = ['bullish', 'bearish', 'neutral'];
    const randomValue = Math.random();
    let direction: 'bullish' | 'bearish' | 'neutral';
    
    if (randomValue > 0.6) {
      direction = 'bullish';
    } else if (randomValue > 0.3) {
      direction = 'bearish';
    } else {
      direction = 'neutral';
    }

    const mockAnalysis = {
      direction,
      strength: Math.floor(Math.random() * 10) + 1,
      volume: Math.floor(Math.random() * 1000000) + 500000,
      keyLevels: [
        48500 + Math.random() * 5000,
        47800 + Math.random() * 3000,
        49200 + Math.random() * 2000
      ].sort((a, b) => a - b)
    };
    return mockAnalysis;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Atualizar status dos mercados e análises VWAP
      const updatedMarkets = marketSessions.map(market => {
        const now = new Date();
        const mockIsActive = Math.random() > 0.7; // Simular mercados ativos
        
        return {
          ...market,
          isActive: mockIsActive,
          vwapAnalysis: mockIsActive ? generateVWAPAnalysis(market) : undefined
        };
      });
      
      setMarkets(updatedMarkets);

      // Gerar sinais VWAP para mercados ativos
      const activeMarkets = updatedMarkets.filter(m => m.isActive);
      if (activeMarkets.length > 0 && Math.random() > 0.8) {
        const randomMarket = activeMarkets[Math.floor(Math.random() * activeMarkets.length)];
        const signals: ('above' | 'below' | 'cross_up' | 'cross_down')[] = ['above', 'below', 'cross_up', 'cross_down'];
        const mockSignal: VWAPSignal = {
          market: randomMarket.name,
          timestamp: new Date(),
          price: 48000 + Math.random() * 4000,
          vwap: 47800 + Math.random() * 3000,
          signal: signals[Math.floor(Math.random() * signals.length)],
          volume: Math.floor(Math.random() * 500000) + 100000,
          strength: Math.floor(Math.random() * 10) + 1
        };
        
        setVwapSignals(prev => [mockSignal, ...prev.slice(0, 19)]);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const getRegionColor = (region: string) => {
    switch (region) {
      case 'Asia': return 'text-blue-400 bg-blue-400/20';
      case 'Europe': return 'text-green-400 bg-green-400/20';
      case 'Americas': return 'text-purple-400 bg-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'cross_up': return 'text-green-400 bg-green-400/20';
      case 'cross_down': return 'text-red-400 bg-red-400/20';
      case 'above': return 'text-blue-400 bg-blue-400/20';
      case 'below': return 'text-orange-400 bg-orange-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Market Sessions */}
      <Card className="bg-[#1C1C1E] border-[#2E2E2E]">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-[#F5F5F5] font-mono">
            <Globe className="w-5 h-5 text-[#00E0FF]" />
            <span>MARKET SESSIONS</span>
            <Badge className="bg-[#00E0FF]/20 text-[#00E0FF]">
              {markets.filter(m => m.isActive).length} Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {markets.map((market, idx) => (
            <div key={idx} className="p-3 bg-[#0A0A0A] rounded border border-[#2E2E2E]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${market.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="font-semibold text-[#F5F5F5] text-sm">{market.name}</span>
                  <Badge className={getRegionColor(market.region)}>
                    {market.region}
                  </Badge>
                </div>
                <span className="text-xs text-[#888888]">{market.timezone}</span>
              </div>
              
              {market.vwapAnalysis && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#AAAAAA]">VWAP Direction:</span>
                      <span className={getDirectionColor(market.vwapAnalysis.direction)}>
                        {market.vwapAnalysis.direction.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#AAAAAA]">Strength:</span>
                      <span className="text-[#F5F5F5]">{market.vwapAnalysis.strength}/10</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#AAAAAA]">Volume:</span>
                      <span className="text-[#F5F5F5]">${(market.vwapAnalysis.volume / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#AAAAAA]">Status:</span>
                      <span className="text-green-400">TRACKING</span>
                    </div>
                  </div>
                </div>
              )}
              
              {!market.isActive && (
                <div className="text-xs text-[#888888] flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Opens at {market.openTime} {market.timezone}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* VWAP Signals */}
      <Card className="bg-[#1C1C1E] border-[#2E2E2E]">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-[#F5F5F5] font-mono">
            <Activity className="w-5 h-5 text-[#A6FF00]" />
            <span>VWAP SIGNALS</span>
            <Badge className="bg-[#A6FF00]/20 text-[#A6FF00]">
              5min Anchor
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
          {vwapSignals.length > 0 ? vwapSignals.map((signal, idx) => (
            <div key={idx} className="p-3 bg-[#0A0A0A] rounded border border-[#2E2E2E] hover:border-[#A6FF00]/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-[#A6FF00]" />
                  <span className="font-semibold text-[#F5F5F5] text-sm">{signal.market}</span>
                </div>
                <Badge className={getSignalColor(signal.signal)}>
                  {signal.signal.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#AAAAAA]">Price:</span>
                    <span className="text-[#F5F5F5]">${signal.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#AAAAAA]">VWAP:</span>
                    <span className="text-[#A6FF00]">${signal.vwap.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#AAAAAA]">Volume:</span>
                    <span className="text-[#F5F5F5]">${(signal.volume / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#AAAAAA]">Strength:</span>
                    <span className="text-[#F5F5F5]">{signal.strength}/10</span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-[#888888] mt-2 pt-2 border-t border-[#2E2E2E]">
                {signal.timestamp.toLocaleTimeString()}
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-[#AAAAAA]">
              <Activity className="w-8 h-8 mx-auto mb-2 text-[#A6FF00]/50" />
              <p>Aguardando sinais VWAP...</p>
              <p className="text-xs mt-1">Timeframe: 5 minutos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
