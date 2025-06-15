
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Volume2, DollarSign, Activity, BarChart3 } from 'lucide-react';
import { useRealFlowData } from '../hooks/useRealFlowData';
import { binanceWebSocketService } from '../services/BinanceWebSocketService';
import { UnusualBuySellSection } from './sections/UnusualBuySellSection';
import { LiquidationAlertSection } from './sections/LiquidationAlertSection';
import { TopVolumeSection } from './sections/TopVolumeSection';
import { LargeOrderSection } from './sections/LargeOrderSection';
import { TradingViewChart } from './TradingViewChart';

export const TradingDashboard: React.FC = () => {
  const { isConnected, connectionStatus, flowData, marketSentiment } = useRealFlowData();
  const [activeSection, setActiveSection] = useState<string>('unusual');

  const sections = [
    { 
      id: 'unusual', 
      label: 'Unusual Buy/Sell', 
      icon: TrendingUp, 
      color: 'blue',
      description: '3min Kline Analysis'
    },
    { 
      id: 'liquidation', 
      label: 'Liquidation Alerts', 
      icon: AlertTriangle, 
      color: 'red',
      description: 'Market Cap Based'
    },
    { 
      id: 'volume', 
      label: 'Top 40 Volume', 
      icon: Volume2, 
      color: 'green',
      description: '24h Futures Volume'
    },
    { 
      id: 'orders', 
      label: 'Large Orders', 
      icon: DollarSign, 
      color: 'purple',
      description: 'Orders > $1M'
    }
  ];

  const getSectionColor = (color: string, active: boolean) => {
    const colors = {
      blue: active ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
      red: active ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
      green: active ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
      purple: active ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <BarChart3 className="w-7 h-7 text-blue-600" />
                <span>Pinnacle AI Pro</span>
              </h1>
              <p className="text-gray-600 text-sm mt-1">Real-time Binance Professional Trading Monitor</p>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isConnected 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                <Activity className="w-4 h-4" />
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              
              {/* Market Sentiment */}
              <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm">
                <span className="text-gray-600">Sentiment: </span>
                <span className="font-medium text-gray-900">{marketSentiment.interpretation}</span>
              </div>
              
              {/* Asset Count */}
              <div className="bg-blue-100 px-3 py-2 rounded-lg text-sm">
                <span className="text-blue-700 font-medium">
                  {connectionInfo.activeAssets}/{connectionInfo.totalSymbols} Assets
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Section Navigation */}
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-4">
            {sections.map((section) => {
              const IconComponent = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${getSectionColor(section.color, isActive)}`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <IconComponent className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-semibold text-sm">{section.label}</div>
                      <div className="text-xs opacity-75">{section.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Active Section */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full">
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                  <div className="flex items-center space-x-2">
                    {sections.find(s => s.id === activeSection)?.icon && (
                      React.createElement(sections.find(s => s.id === activeSection)!.icon, { 
                        className: "w-5 h-5 text-gray-700" 
                      })
                    )}
                    <h2 className="text-lg font-bold text-gray-900">
                      {sections.find(s => s.id === activeSection)?.label}
                    </h2>
                  </div>
                </div>
                
                <div className="flex-1 p-6 overflow-hidden">
                  {activeSection === 'unusual' && <UnusualBuySellSection />}
                  {activeSection === 'liquidation' && <LiquidationAlertSection />}
                  {activeSection === 'volume' && <TopVolumeSection />}
                  {activeSection === 'orders' && <LargeOrderSection />}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - TradingView Chart */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>TradingView Chart</span>
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Professional charting and analysis</p>
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
