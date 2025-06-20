
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
      <div className="min-h-screen bg-black grid-overlay">
        <div className="max-w-7xl mx-auto p-6">
          {/* ASCII Header */}
          <div className="terminal mb-6 scanlines">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="brutal-btn px-4 py-2 text-sm"
                >
                  &lt;&lt; BACK
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 border-2 border-electric bg-electric flex items-center justify-center">
                    <Eye className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h1 className="font-display text-neon text-2xl">LIQUIDATION_MONITOR</h1>
                    <p className="text-electric font-mono text-sm">REAL-TIME TRACKING // TREND REVERSAL DETECTION</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/database')}
                className="brutal-btn px-4 py-2 text-sm"
              >
                <Database className="w-4 h-4 mr-2" />
                DATABASE
              </button>
            </div>
          </div>

          {/* ASCII Section Divider */}
          <div className="ascii-divider mb-6"></div>

          {/* Liquidation Bubble Map */}
          <div className="brutal-card mb-8 scanlines" style={{ height: '700px' }}>
            <div className="p-4 border-b-2 border-neon">
              <h2 className="font-display text-electric text-lg glitch" data-text="LIQUIDATION_BUBBLE_MAP">
                LIQUIDATION_BUBBLE_MAP
              </h2>
            </div>
            <div className="h-[calc(100%-4rem)]">
              <LiquidationBubbleMap />
            </div>
          </div>

          {/* ASCII Section Divider */}
          <div className="ascii-divider mb-6"></div>

          {/* CoinTrendHunter */}
          <div className="brutal-card h-[500px] scanlines">
            <div className="p-4 border-b-2 border-neon">
              <h2 className="font-display text-electric text-lg glitch" data-text="COIN_TREND_HUNTER">
                COIN_TREND_HUNTER
              </h2>
            </div>
            <div className="h-[calc(100%-4rem)]">
              <CoinTrendHunter />
            </div>
          </div>
        </div>
      </div>
    </TradingProvider>
  );
};
