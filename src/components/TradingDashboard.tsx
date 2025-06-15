
import React from 'react';
import { TradingProvider } from '../contexts/TradingContext';
import { LiquidationBubbleMap } from './LiquidationBubbleMap';
import { CoinTrendHunter } from './CoinTrendHunter';

export const TradingDashboard: React.FC = () => {
  return (
    <TradingProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Liquidation Monitor</h1>
            <p className="text-lg text-gray-600">Real-time liquidation tracking and micro-cap detection</p>
          </div>

          {/* Liquidation Bubble Map - Top Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow h-[500px]">
            <LiquidationBubbleMap />
          </div>

          {/* CoinTrendHunter - Bottom Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow h-[500px]">
            <CoinTrendHunter />
          </div>
        </div>
      </div>
    </TradingProvider>
  );
};
