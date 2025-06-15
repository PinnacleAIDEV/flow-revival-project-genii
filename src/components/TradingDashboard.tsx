
import React from 'react';
import { ArrowLeft, Database, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { TradingProvider } from '../contexts/TradingContext';
import { LiquidationBubbleMap } from './LiquidationBubbleMap';
import { CoinTrendHunter } from './CoinTrendHunter';

export const TradingDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <TradingProvider>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-slate-800">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 bg-gray-900/90 backdrop-blur-md rounded-t-2xl mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-2 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-cyan-400"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>VOLTAR</span>
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center relative">
                    <Eye className="w-5 h-5 text-black" />
                    <div className="absolute inset-0 bg-cyan-400/20 rounded-lg animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white font-mono">LIQUIDATION MONITOR</h1>
                    <p className="text-gray-400">Rastreamento em tempo real e detecção de micro-caps</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => navigate('/database')}
                  variant="outline"
                  className="flex items-center space-x-2 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-cyan-400"
                >
                  <Database className="w-4 h-4" />
                  <span>DATABASE</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Liquidation Bubble Map - Top Section */}
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700 hover:border-cyan-400/50 overflow-hidden hover:shadow-cyan-400/10 transition-all h-[500px] mb-8">
            <LiquidationBubbleMap />
          </div>

          {/* CoinTrendHunter - Bottom Section */}
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700 hover:border-cyan-400/50 overflow-hidden hover:shadow-cyan-400/10 transition-all h-[500px]">
            <CoinTrendHunter />
          </div>
        </div>
      </div>
    </TradingProvider>
  );
};
