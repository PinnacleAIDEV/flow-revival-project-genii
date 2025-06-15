
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Volume2, DollarSign, Activity } from 'lucide-react';
import { useRealFlowData } from '../hooks/useRealFlowData';
import { UnusualBuySellSection } from './sections/UnusualBuySellSection';
import { LiquidationAlertSection } from './sections/LiquidationAlertSection';
import { TopVolumeSection } from './sections/TopVolumeSection';
import { LargeOrderSection } from './sections/LargeOrderSection';

export const TradingDashboard: React.FC = () => {
  const { isConnected, connectionStatus, flowData } = useRealFlowData();
  const [activeSection, setActiveSection] = useState<string>('unusual');

  const sections = [
    { id: 'unusual', label: 'Unusual Buy/Sell', icon: TrendingUp, color: 'blue' },
    { id: 'liquidation', label: 'Liquidation Alerts', icon: AlertTriangle, color: 'red' },
    { id: 'volume', label: 'Top 40 Volume', icon: Volume2, color: 'green' },
    { id: 'orders', label: 'Large Orders', icon: DollarSign, color: 'purple' }
  ];

  const getSectionColor = (color: string, active: boolean) => {
    const colors = {
      blue: active ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      red: active ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200',
      green: active ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200',
      purple: active ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pinnacle Trading Monitor</h1>
            <p className="text-gray-600 mt-1">Real-time Binance Professional Trading Alerts</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              isConnected ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
            }`}>
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isConnected ? 'Binance Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              Active Pairs: {flowData.length}
            </div>
          </div>
        </div>
      </div>

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
                className={`p-4 rounded-lg border transition-all duration-200 ${getSectionColor(section.color, isActive)}`}
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Active Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
            {activeSection === 'unusual' && <UnusualBuySellSection />}
            {activeSection === 'liquidation' && <LiquidationAlertSection />}
            {activeSection === 'volume' && <TopVolumeSection />}
            {activeSection === 'orders' && <LargeOrderSection />}
          </div>
        </div>

        {/* Center Panel - TradingView Chart Placeholder */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full min-h-[600px]">
            <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">TradingView Chart</h3>
                <p className="text-gray-500">Gráfico TradingView será integrado aqui</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
