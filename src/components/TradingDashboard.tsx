
import React from 'react';
import { ArrowLeft, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { TradingProvider } from '../contexts/TradingContext';
import { LiquidationBubbleMap } from './LiquidationBubbleMap';
import { CoinTrendHunter } from './CoinTrendHunter';

export const TradingDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <TradingProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-white rounded-t-2xl mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Liquidation Monitor</h1>
                  <p className="text-gray-600">Real-time liquidation tracking and micro-cap detection</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => navigate('/database')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Database className="w-4 h-4" />
                  <span>Database</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Liquidation Bubble Map - Top Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow h-[500px] mb-8">
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
