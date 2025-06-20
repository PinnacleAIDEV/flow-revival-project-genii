
import React from 'react';
import { ArrowLeft, Brain, TrendingUp, Newspaper, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DirectionAnalyzer } from '../components/ai/DirectionAnalyzer';
import { NewsAnalyzer } from '../components/ai/NewsAnalyzer';
import { MarketPerceptionAnalyzer } from '../components/ai/MarketPerceptionAnalyzer';
import { MarketOpeningTracker } from '../components/ai/MarketOpeningTracker';
import { ErrorBoundary } from '../components/ui/error-boundary';

const AIAnalytics: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1C1C1E] to-[#0A0A0A]">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="p-4 border-b border-[#2E2E2E] bg-[#1C1C1E]/90 backdrop-blur-md rounded-t-2xl mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-2 border-[#2E2E2E] text-[#AAAAAA] hover:bg-[#2E2E2E] hover:border-[#00E0FF] hover:text-[#F5F5F5]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>VOLTAR</span>
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#A6FF00] to-[#00E0FF] rounded-lg flex items-center justify-center relative">
                    <Brain className="w-5 h-5 text-black" />
                    <div className="absolute inset-0 bg-[#A6FF00]/20 rounded-lg animate-pulse"></div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#F5F5F5] font-mono">AI ANALYTICS SUITE 🧠</h2>
                    <div className="flex items-center space-x-4 text-sm text-[#AAAAAA]">
                      <span>Advanced market intelligence powered by AI/ML</span>
                      <Badge className="bg-[#A6FF00]/20 text-[#A6FF00] border-[#A6FF00]/30">
                        TERCEIRA ONDA
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  AI ATIVO
                </Badge>
                <Button
                  onClick={() => navigate('/unusual-volume')}
                  variant="outline"
                  className="flex items-center space-x-2 border-[#2E2E2E] text-[#AAAAAA] hover:bg-[#2E2E2E] hover:border-[#00E0FF] hover:text-[#F5F5F5]"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>VOLUME DATA</span>
                </Button>
              </div>
            </div>
          </div>

          {/* AI Analytics Grid */}
          <div className="space-y-6">
            {/* Direction Analyzer */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <DirectionAnalyzer />
              <NewsAnalyzer />
            </div>

            {/* Market Perception */}
            <div className="grid grid-cols-1 gap-6">
              <MarketPerceptionAnalyzer />
            </div>

            {/* Market Opening Tracker */}
            <div className="grid grid-cols-1 gap-6">
              <MarketOpeningTracker />
            </div>
          </div>

          {/* Info Footer */}
          <div className="mt-8 p-4 bg-[#1C1C1E]/50 rounded-lg border border-[#2E2E2E]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-[#00E0FF]" />
                <span className="text-[#AAAAAA]">Direction Analysis: Liquidações + Volume</span>
              </div>
              <div className="flex items-center space-x-2">
                <Newspaper className="w-4 h-4 text-[#00E0FF]" />
                <span className="text-[#AAAAAA]">News Analysis: Sentiment IA</span>
              </div>
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-[#A6FF00]" />
                <span className="text-[#AAAAAA]">Market Perception: Análise contextual</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-[#A6FF00]" />
                <span className="text-[#AAAAAA]">VWAP Tracker: 5min anchor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AIAnalytics;
