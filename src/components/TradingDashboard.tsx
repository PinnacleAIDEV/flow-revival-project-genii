
import React, { useState } from 'react';
import { AlertTriangle, BarChart3, Zap, Wifi, Activity, Pause, Play } from 'lucide-react';
import { useRealFlowData } from '../hooks/useRealFlowData';
import { binanceWebSocketService } from '../services/BinanceWebSocketService';
import { LiquidationAlertSection } from './sections/LiquidationAlertSection';
import { TradingViewChart } from './TradingViewChart';

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

  // Calculate liquidations only
  const liquidations = alerts.filter(a => a.type === 'liquidation').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Simplified Header */}
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
                <p className="text-gray-600 text-sm mt-1">TradingView & Liquidation Monitor</p>
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Simplified 2-Column Layout */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          
          {/* Left Side - Liquidations Only */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow h-full">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-red-600 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Liquidations</h3>
                      <p className="text-xs text-gray-500">Market Events Monitor</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-600">{liquidations}</div>
                    <div className="text-xs text-gray-500">Detected</div>
                  </div>
                </div>
              </div>
              <div className="h-[calc(100%-100px)] overflow-hidden">
                <LiquidationAlertSection />
              </div>
            </div>
          </div>

          {/* Right Side - TradingView Chart Only */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow h-full">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-gray-700 rounded-lg">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Market Analysis</h3>
                      <p className="text-xs text-gray-500">TradingView Professional Chart</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>BTCUSDT • 15min</span>
                  </div>
                </div>
              </div>
              <div className="h-[calc(100%-80px)]">
                <TradingViewChart />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
