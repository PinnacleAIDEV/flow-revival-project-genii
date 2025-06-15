
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Volume2, DollarSign, Activity, BarChart3, Zap, Wifi, Filter, Settings, Pause, Play } from 'lucide-react';
import { useRealFlowData } from '../hooks/useRealFlowData';
import { binanceWebSocketService } from '../services/BinanceWebSocketService';
import { UnusualBuySellSection } from './sections/UnusualBuySellSection';
import { LiquidationAlertSection } from './sections/LiquidationAlertSection';
import { TopVolumeSection } from './sections/TopVolumeSection';
import { LargeOrderSection } from './sections/LargeOrderSection';
import { TradingViewChart } from './TradingViewChart';
import { LiveSignalsFeed } from './LiveSignalsFeed';

export const TradingDashboard: React.FC = () => {
  const { isConnected, connectionStatus, flowData, marketSentiment, alerts } = useRealFlowData();
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');

  const getConnectionInfo = () => {
    const status = binanceWebSocketService.getConnectionStatus();
    return {
      ...status,
      activeAssets: flowData.length,
      totalSymbols: status.totalSymbols || 200
    };
  };

  const connectionInfo = getConnectionInfo();

  // Calculate real-time statistics
  const stats = {
    totalAlerts: alerts.length,
    buySignals: alerts.filter(a => a.type === 'unusual_volume' && a.details?.direction === 'buy').length,
    sellSignals: alerts.filter(a => a.type === 'unusual_volume' && a.details?.direction === 'sell').length,
    liquidations: alerts.filter(a => a.type === 'liquidation').length,
    largeOrders: alerts.filter(a => a.type === 'large_order').length,
    topGainer: flowData.reduce((max, current) => (current.change_24h > max.change_24h ? current : max), flowData[0] || { ticker: 'N/A', change_24h: 0 }),
    topLoser: flowData.reduce((min, current) => (current.change_24h < min.change_24h ? current : min), flowData[0] || { ticker: 'N/A', change_24h: 0 })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Pinnacle AI Pro
                </h1>
                <p className="text-gray-600 text-sm mt-1">Professional Trading Intelligence Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`p-2 rounded-lg transition-colors ${
                    isPaused ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <select 
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="1m">1min</option>
                  <option value="5m">5min</option>
                  <option value="15m">15min</option>
                  <option value="1h">1hour</option>
                </select>
              </div>

              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium border-2 ${
                isConnected 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                <span>{isConnected ? 'Live Data' : 'Disconnected'}</span>
                {isConnected && <Zap className="w-3 h-3 animate-pulse" />}
              </div>
              
              {/* Market Sentiment */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-xl text-sm border shadow-sm">
                <span className="text-gray-600">Market: </span>
                <span className={`font-bold ${
                  marketSentiment.score > 0.1 ? 'text-green-600' : 
                  marketSentiment.score < -0.1 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {marketSentiment.interpretation}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-7 gap-4 mt-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{stats.totalAlerts}</div>
              <div className="text-xs text-blue-700">Total Alerts</div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{stats.buySignals}</div>
              <div className="text-xs text-green-700">Buy Signals</div>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{stats.sellSignals}</div>
              <div className="text-xs text-red-700">Sell Signals</div>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{stats.liquidations}</div>
              <div className="text-xs text-orange-700">Liquidations</div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{stats.largeOrders}</div>
              <div className="text-xs text-purple-700">Large Orders</div>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-3 rounded-lg border border-emerald-200">
              <div className="text-lg font-bold text-emerald-600">{stats.topGainer?.ticker?.replace('USDT', '') || 'N/A'}</div>
              <div className="text-xs text-emerald-700">Top Gainer</div>
              <div className="text-xs text-emerald-600">+{stats.topGainer?.change_24h?.toFixed(2) || 0}%</div>
            </div>
            <div className="bg-gradient-to-r from-rose-50 to-rose-100 p-3 rounded-lg border border-rose-200">
              <div className="text-lg font-bold text-rose-600">{stats.topLoser?.ticker?.replace('USDT', '') || 'N/A'}</div>
              <div className="text-xs text-rose-700">Top Loser</div>
              <div className="text-xs text-rose-600">{stats.topLoser?.change_24h?.toFixed(2) || 0}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-300px)]">
          
          {/* Left Side - 4 Alert Lists (2x2 Grid) */}
          <div className="col-span-12 lg:col-span-6">
            <div className="grid grid-cols-2 gap-4 h-full">
              
              {/* Buy/Sell Signals */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Buy/Sell</h3>
                        <p className="text-xs text-gray-500">Kline Analysis</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">{stats.buySignals + stats.sellSignals}</div>
                      <div className="text-xs text-gray-500">Active</div>
                    </div>
                  </div>
                </div>
                <div className="h-[calc(100%-100px)] overflow-hidden">
                  <UnusualBuySellSection />
                </div>
              </div>

              {/* Liquidations */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-red-600 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Liquidations</h3>
                        <p className="text-xs text-gray-500">Market Events</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-red-600">{stats.liquidations}</div>
                      <div className="text-xs text-gray-500">Detected</div>
                    </div>
                  </div>
                </div>
                <div className="h-[calc(100%-100px)] overflow-hidden">
                  <LiquidationAlertSection />
                </div>
              </div>

              {/* Top Volume */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <Volume2 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Top Volume</h3>
                        <p className="text-xs text-gray-500">24h Rankings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">{connectionInfo.activeAssets}</div>
                      <div className="text-xs text-gray-500">Assets</div>
                    </div>
                  </div>
                </div>
                <div className="h-[calc(100%-100px)] overflow-hidden">
                  <TopVolumeSection />
                </div>
              </div>

              {/* Large Orders */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Large Orders</h3>
                        <p className="text-xs text-gray-500">Whale Activity</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-purple-600">{stats.largeOrders}</div>
                      <div className="text-xs text-gray-500">Orders</div>
                    </div>
                  </div>
                </div>
                <div className="h-[calc(100%-100px)] overflow-hidden">
                  <LargeOrderSection />
                </div>
              </div>

            </div>
          </div>

          {/* Right Side - TradingView Chart and Live Signals */}
          <div className="col-span-12 lg:col-span-6">
            <div className="grid grid-rows-2 gap-4 h-full">
              
              {/* TradingView Chart */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-gray-700 rounded-lg">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Market Analysis</h3>
                        <p className="text-xs text-gray-500">TradingView Professional</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <Settings className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="h-[calc(100%-80px)]">
                  <TradingViewChart />
                </div>
              </div>

              {/* Live Signals Feed */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-orange-600 rounded-lg">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Live Signals</h3>
                        <p className="text-xs text-gray-500">All Alerts Combined</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-xl font-bold text-orange-600">{stats.totalAlerts}</div>
                        <div className="text-xs text-gray-500">Live</div>
                      </div>
                      <button className="p-2 hover:bg-orange-100 rounded-lg transition-colors">
                        <Filter className="w-4 h-4 text-orange-600" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="h-[calc(100%-80px)] overflow-hidden">
                  <LiveSignalsFeed />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
