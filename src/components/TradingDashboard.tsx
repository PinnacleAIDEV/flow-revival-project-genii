
import React from 'react';
import { BarChart3 } from 'lucide-react';
import { LiquidationBubbleMap } from './LiquidationBubbleMap';
import { TradingViewChart } from './TradingViewChart';

export const TradingDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TradingView Chart - Top Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow h-[500px]">
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

        {/* Liquidation Bubble Map - Bottom Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow h-[500px]">
          <LiquidationBubbleMap />
        </div>

      </div>
    </div>
  );
};
