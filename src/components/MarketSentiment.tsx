
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface SentimentData {
  score: number;
  interpretation: string;
  bullish_count: number;
  bearish_count: number;
  neutral_count: number;
}

interface VolumePattern {
  pattern: string;
  tickers: string[];
  strength: number;
  timeframe: string;
}

export const MarketSentiment: React.FC = () => {
  const [sentimentData, setSentimentData] = useState<SentimentData>({
    score: 0.15,
    interpretation: 'Slightly Bullish',
    bullish_count: 12,
    bearish_count: 8,
    neutral_count: 5
  });

  const [volumePatterns, setVolumePatterns] = useState<VolumePattern[]>([
    { pattern: 'Accumulation', tickers: ['BTC/USDT', 'ETH/USDT'], strength: 75, timeframe: '5m' },
    { pattern: 'Breakout', tickers: ['BNB/USDT'], strength: 85, timeframe: '15m' },
    { pattern: 'Distribution', tickers: ['ADA/USDT'], strength: 60, timeframe: '30m' }
  ]);

  const pieData = [
    { name: 'Bullish', value: sentimentData.bullish_count, color: '#10b981' },
    { name: 'Bearish', value: sentimentData.bearish_count, color: '#ef4444' },
    { name: 'Neutral', value: sentimentData.neutral_count, color: '#6b7280' }
  ];

  const volumeData = [
    { name: 'BTC', volume: 125000, change: 15.2 },
    { name: 'ETH', volume: 89000, change: -8.5 },
    { name: 'BNB', volume: 45000, change: 22.1 },
    { name: 'ADA', volume: 32000, change: -12.3 },
    { name: 'SOL', volume: 28000, change: 5.7 }
  ];

  useEffect(() => {
    // Simular atualizações de sentimento em tempo real
    const interval = setInterval(() => {
      setSentimentData(prev => ({
        ...prev,
        score: (Math.random() - 0.5) * 0.8, // Entre -0.4 e 0.4
        bullish_count: Math.floor(Math.random() * 20) + 5,
        bearish_count: Math.floor(Math.random() * 15) + 3,
        neutral_count: Math.floor(Math.random() * 10) + 2
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-600 bg-green-100';
    if (score > 0.1) return 'text-green-600 bg-green-50';
    if (score > -0.1) return 'text-gray-600 bg-gray-100';
    if (score > -0.3) return 'text-red-600 bg-red-50';
    return 'text-red-600 bg-red-100';
  };

  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'Accumulation': return 'bg-green-100 text-green-700 border-green-500';
      case 'Distribution': return 'bg-red-100 text-red-700 border-red-500';
      case 'Breakout': return 'bg-blue-100 text-blue-700 border-blue-500';
      default: return 'bg-gray-100 text-gray-700 border-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Market Sentiment Score */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          Market Sentiment Score
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${getSentimentColor(sentimentData.score)}`}>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {(sentimentData.score * 100).toFixed(1)}%
                </div>
                <div className="text-sm mt-1">
                  {sentimentData.interpretation}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">{sentimentData.bullish_count}</div>
                <div className="text-xs text-green-600">Bullish</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-600">{sentimentData.neutral_count}</div>
                <div className="text-xs text-gray-600">Neutral</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-xl font-bold text-red-600">{sentimentData.bearish_count}</div>
                <div className="text-xs text-red-600">Bearish</div>
              </div>
            </div>
          </div>
          
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Volume Patterns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
          Volume Patterns Detected
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {volumePatterns.map((pattern, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${getPatternColor(pattern.pattern)}`}
            >
              <div className="font-medium">{pattern.pattern}</div>
              <div className="text-sm mt-1">Strength: {pattern.strength}%</div>
              <div className="text-sm">Timeframe: {pattern.timeframe}</div>
              <div className="text-xs mt-2">
                Tickers: {pattern.tickers.join(', ')}
              </div>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={volumeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'volume' ? `${value.toLocaleString()}` : `${value}%`,
                name === 'volume' ? 'Volume' : 'Change 24h'
              ]}
            />
            <Bar dataKey="volume" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
