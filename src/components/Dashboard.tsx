
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Activity, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

interface DashboardMetrics {
  totalAlerts: number;
  totalVolume: number;
  avgPrice: number;
  topPerformers: Array<{
    ticker: string;
    change: number;
    volume: number;
    price: number;
  }>;
  marketSentiment: string;
  alertsByTimeframe: Array<{
    timeframe: string;
    count: number;
  }>;
  volumeByExchange: Array<{
    exchange: string;
    volume: number;
    percentage: number;
  }>;
}

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalAlerts: 0,
    totalVolume: 0,
    avgPrice: 0,
    topPerformers: [],
    marketSentiment: 'Neutral',
    alertsByTimeframe: [],
    volumeByExchange: []
  });

  const [selectedPeriod, setSelectedPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [priceHistory, setPriceHistory] = useState<Array<{time: string, btc: number, eth: number, bnb: number}>>([]);

  useEffect(() => {
    // Simular dados do dashboard
    const mockMetrics: DashboardMetrics = {
      totalAlerts: 1247,
      totalVolume: 2456789012,
      avgPrice: 45230.50,
      topPerformers: [
        { ticker: 'BTC/USDT', change: 5.2, volume: 1234567890, price: 45230.50 },
        { ticker: 'ETH/USDT', change: 3.8, volume: 987654321, price: 2890.75 },
        { ticker: 'BNB/USDT', change: 2.1, volume: 456789012, price: 335.25 },
        { ticker: 'ADA/USDT', change: -1.5, volume: 234567890, price: 0.45 },
        { ticker: 'SOL/USDT', change: 4.7, volume: 345678901, price: 125.80 }
      ],
      marketSentiment: 'Bullish',
      alertsByTimeframe: [
        { timeframe: '1m', count: 45 },
        { timeframe: '3m', count: 89 },
        { timeframe: '5m', count: 156 },
        { timeframe: '30m', count: 234 },
        { timeframe: '1h', count: 189 },
        { timeframe: '1d', count: 67 }
      ],
      volumeByExchange: [
        { exchange: 'Binance', volume: 1500000000, percentage: 61 },
        { exchange: 'Coinbase', volume: 600000000, percentage: 24 },
        { exchange: 'Kraken', volume: 250000000, percentage: 10 },
        { exchange: 'Other', volume: 106789012, percentage: 5 }
      ]
    };

    const mockPriceHistory = Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      btc: 45000 + Math.random() * 1000 - 500,
      eth: 2800 + Math.random() * 200 - 100,
      bnb: 330 + Math.random() * 20 - 10
    }));

    setMetrics(mockMetrics);
    setPriceHistory(mockPriceHistory);
  }, [selectedPeriod]);

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
    return `$${volume.toFixed(2)}`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish': return 'text-green-600 bg-green-100';
      case 'bearish': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Flow Analytics Dashboard</h2>
        <div className="flex space-x-2">
          {(['1h', '24h', '7d', '30d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalAlerts.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+12.5% from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900">{formatVolume(metrics.totalVolume)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+8.3% from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg BTC Price</p>
              <p className="text-2xl font-bold text-gray-900">${metrics.avgPrice.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-sm text-red-600">-2.1% from last period</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Market Sentiment</p>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(metrics.marketSentiment)}`}>
                {metrics.marketSentiment}
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">Based on flow analysis</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price History Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price History ({selectedPeriod})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name.toUpperCase()]}
              />
              <Line 
                type="monotone" 
                dataKey="btc" 
                stroke="#f7931a" 
                strokeWidth={2}
                name="btc"
              />
              <Line 
                type="monotone" 
                dataKey="eth" 
                stroke="#627eea" 
                strokeWidth={2}
                name="eth"
              />
              <Line 
                type="monotone" 
                dataKey="bnb" 
                stroke="#f3ba2f" 
                strokeWidth={2}
                name="bnb"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts by Timeframe */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts by Timeframe</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.alertsByTimeframe}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeframe" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Volume by Exchange */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Volume Distribution</h3>
          <div className="space-y-4">
            {metrics.volumeByExchange.map((exchange, index) => (
              <div key={exchange.exchange} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full bg-blue-${(index + 1) * 100}`}></div>
                  <span className="font-medium text-gray-900">{exchange.exchange}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatVolume(exchange.volume)}</div>
                  <div className="text-sm text-gray-500">{exchange.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-3">
            {metrics.topPerformers.map((performer, index) => (
              <div key={performer.ticker} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-bold text-gray-600">#{index + 1}</div>
                  <div>
                    <div className="font-medium text-gray-900">{performer.ticker}</div>
                    <div className="text-sm text-gray-500">{formatVolume(performer.volume)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">${performer.price.toLocaleString()}</div>
                  <div className={`text-sm ${performer.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {performer.change >= 0 ? '+' : ''}{performer.change.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
