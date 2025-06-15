
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Volume2, DollarSign, Activity, BarChart3, Zap, Wifi } from 'lucide-react';
import { useRealFlowData } from '../hooks/useRealFlowData';
import { binanceWebSocketService } from '../services/BinanceWebSocketService';
import { UnusualBuySellSection } from './sections/UnusualBuySellSection';
import { LiquidationAlertSection } from './sections/LiquidationAlertSection';
import { TopVolumeSection } from './sections/TopVolumeSection';
import { LargeOrderSection } from './sections/LargeOrderSection';
import { TradingViewChart } from './TradingViewChart';

export const TradingDashboard: React.FC = () => {
  const { isConnected, connectionStatus, flowData, marketSentiment, alerts } = useRealFlowData();
  const [activeSection, setActiveSection] = useState<string>('unusual');

  const sections = [
    { 
      id: 'unusual', 
      label: 'Buy/Sell Signals', 
      icon: TrendingUp, 
      color: 'blue',
      description: 'Kline Analysis',
      count: alerts.filter(a => a.type === 'unusual_volume').length
    },
    { 
      id: 'liquidation', 
      label: 'Liquidations', 
      icon: AlertTriangle, 
      color: 'red',
      description: 'Market Events',
      count: alerts.filter(a => a.type === 'liquidation').length
    },
    { 
      id: 'volume', 
      label: 'Top Volume', 
      icon: Volume2, 
      color: 'green',
      description: '24h Rankings',
      count: flowData.filter(d => d.volume_24h > 100000000).length
    },
    { 
      id: 'orders', 
      label: 'Large Orders', 
      icon: DollarSign, 
      color: 'purple',
      description: 'Whale Activity',
      count: alerts.filter(a => a.type === 'large_order').length
    }
  ];

  const getSectionColor = (color: string, active: boolean) => {
    const colors = {
      blue: active 
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg transform scale-105' 
        : 'bg-white text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300 hover:shadow-md',
      red: active 
        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 shadow-lg transform scale-105' 
        : 'bg-white text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 hover:shadow-md',
      green: active 
        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-600 shadow-lg transform scale-105' 
        : 'bg-white text-green-700 hover:bg-green-50 border-green-200 hover:border-green-300 hover:shadow-md',
      purple: active 
        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-600 shadow-lg transform scale-105' 
        : 'bg-white text-purple-700 hover:bg-purple-50 border-purple-200 hover:border-purple-300 hover:shadow-md'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

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
      {/* Enhanced Header */}
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
              {/* Enhanced Connection Status */}
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
          
          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            {sections.map((section) => {
              const IconComponent = section.icon;
              return (
                <div key={section.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <IconComponent className={`w-5 h-5 text-${section.color}-600`} />
                      <span className="text-sm font-medium text-gray-700">{section.label}</span>
                    </div>
                    <span className={`text-lg font-bold text-${section.color}-600`}>
                      {section.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Enhanced Section Navigation */}
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-4">
            {sections.map((section) => {
              const IconComponent = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-102 ${getSectionColor(section.color, isActive)}`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <IconComponent className="w-7 h-7" />
                      {section.count > 0 && (
                        <span className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                          isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                        }`}>
                          {section.count > 99 ? '99+' : section.count}
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm">{section.label}</div>
                      <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                        {section.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Enhanced Main Dashboard Grid */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-280px)]">
          {/* Left Panel - Active Section */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 h-full overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {sections.find(s => s.id === activeSection)?.icon && (
                        React.createElement(sections.find(s => s.id === activeSection)!.icon, { 
                          className: "w-6 h-6 text-gray-700" 
                        })
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {sections.find(s => s.id === activeSection)?.label}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {sections.find(s => s.id === activeSection)?.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                      Live Data
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  {activeSection === 'unusual' && <UnusualBuySellSection />}
                  {activeSection === 'liquidation' && <LiquidationAlertSection />}
                  {activeSection === 'volume' && <TopVolumeSection />}
                  {activeSection === 'orders' && <LargeOrderSection />}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Enhanced TradingView Chart */}
          <div className="col-span-12 lg:col-span-7">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 h-full overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Market Analysis</h2>
                        <p className="text-sm text-gray-500">Professional charting tools</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                        TradingView
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-6">
                  <TradingViewChart />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
