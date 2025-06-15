
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Volume2, DollarSign, Activity, BarChart3, Zap, Wifi } from 'lucide-react';
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

  const getConnectionInfo = () => {
    const status = binanceWebSocketService.getConnectionStatus();
    return {
      ...status,
      activeAssets: flowData.length,
      totalSymbols: status.totalSymbols || 200
    };
  };

  const connectionInfo = getConnectionInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
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
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium border-2 ${
                isConnected 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                <span>{isConnected ? 'Live Data' : 'Disconnected'}</span>
                {isConnected && <Zap className="w-3 h-3" />}
              </div>
              
              {/* Market Sentiment */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-xl text-sm border">
                <span className="text-gray-600">Market: </span>
                <span className={`font-bold ${
                  marketSentiment.score > 0.1 ? 'text-green-600' : 
                  marketSentiment.score < -0.1 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {marketSentiment.interpretation}
                </span>
              </div>
              
              {/* Asset Count */}
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-xl text-sm border border-blue-200">
                <span className="text-blue-700 font-bold">
                  {connectionInfo.activeAssets}/{connectionInfo.totalSymbols} Assets
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          
          {/* Left Side - 4 Alert Lists (2x2 Grid) */}
          <div className="col-span-12 lg:col-span-6">
            <div className="grid grid-cols-2 gap-4 h-full">
              
              {/* Buy/Sell Signals */}
              <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Buy/Sell Signals</h3>
                      <p className="text-xs text-gray-500">Kline Analysis</p>
                    </div>
                  </div>
                </div>
                <div className="h-[calc(100%-80px)] overflow-hidden">
                  <UnusualBuySellSection />
                </div>
              </div>

              {/* Liquidations */}
              <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Liquidations</h3>
                      <p className="text-xs text-gray-500">Market Events</p>
                    </div>
                  </div>
                </div>
                <div className="h-[calc(100%-80px)] overflow-hidden">
                  <LiquidationAlertSection />
                </div>
              </div>

              {/* Top Volume */}
              <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-5 h-5 text-green-600" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Top Volume</h3>
                      <p className="text-xs text-gray-500">24h Rankings</p>
                    </div>
                  </div>
                </div>
                <div className="h-[calc(100%-80px)] overflow-hidden">
                  <TopVolumeSection />
                </div>
              </div>

              {/* Large Orders */}
              <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Large Orders</h3>
                      <p className="text-xs text-gray-500">Whale Activity</p>
                    </div>
                  </div>
                </div>
                <div className="h-[calc(100%-80px)] overflow-hidden">
                  <LargeOrderSection />
                </div>
              </div>

            </div>
          </div>

          {/* Right Side - TradingView Chart and Live Signals */}
          <div className="col-span-12 lg:col-span-6">
            <div className="grid grid-rows-2 gap-4 h-full">
              
              {/* TradingView Chart */}
              <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-gray-700" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Market Analysis</h3>
                      <p className="text-xs text-gray-500">TradingView Professional</p>
                    </div>
                  </div>
                </div>
                <div className="h-[calc(100%-80px)]">
                  <TradingViewChart />
                </div>
              </div>

              {/* Live Signals Feed */}
              <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-orange-600" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Live Signals</h3>
                      <p className="text-xs text-gray-500">All Alerts Combined</p>
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
