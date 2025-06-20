
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, TrendingUp, Globe, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DirectionAnalyzer } from '@/components/ai/DirectionAnalyzer';
import { NewsAnalyzer } from '@/components/ai/NewsAnalyzer';
import { MarketPerceptionAnalyzer } from '@/components/ai/MarketPerceptionAnalyzer';
import { MarketOpeningTracker } from '@/components/ai/MarketOpeningTracker';

const AIAnalytics = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'direction' | 'news' | 'perception' | 'market'>('direction');

  const tabs = [
    { id: 'direction' as const, label: 'DIRECTION_ANALYZER', icon: TrendingUp },
    { id: 'news' as const, label: 'NEWS_ANALYZER', icon: Activity },
    { id: 'perception' as const, label: 'MARKET_PERCEPTION', icon: Brain },
    { id: 'market' as const, label: 'MARKET_TRACKER', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-black grid-overlay">
      <div className="max-w-7xl mx-auto p-6">
        {/* ASCII Header */}
        <div className="terminal mb-6 scanlines">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="brutal-btn px-4 py-2 text-sm"
              >
                &lt;&lt; BACK
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 border-2 border-neon bg-neon flex items-center justify-center">
                  <Brain className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h1 className="font-display text-neon text-2xl">AI_ANALYTICS_SUITE</h1>
                  <p className="text-electric font-mono text-sm">ARTIFICIAL INTELLIGENCE // MARKET ANALYSIS // REAL-TIME INSIGHTS</p>
                </div>
              </div>
            </div>
          </div>

          {/* ASCII Art Banner */}
          <pre className="text-neon text-xs font-mono leading-none mb-4">
{`
 █████╗ ██╗    ██╗██╗███╗   ██╗████████╗███████╗██╗     ██╗     ██╗ ██████╗ ███████╗███╗   ██╗ ██████╗███████╗
██╔══██╗██║    ██║██║████╗  ██║╚══██╔══╝██╔════╝██║     ██║     ██║██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔════╝
███████║██║ █╗ ██║██║██╔██╗ ██║   ██║   █████╗  ██║     ██║     ██║██║  ███╗█████╗  ██╔██╗ ██║██║     █████╗  
██╔══██║██║███╗██║██║██║╚██╗██║   ██║   ██╔══╝  ██║     ██║     ██║██║   ██║██╔══╝  ██║╚██╗██║██║     ██╔══╝  
██║  ██║╚███╔███╔╝██║██║ ╚████║   ██║   ███████╗███████╗███████╗██║╚██████╔╝███████╗██║ ╚████║╚██████╗███████╗
╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚══════╝╚══════╝╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚══════╝
`}
          </pre>

          {/* Tab Navigation */}
          <div className="flex space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 border-2 font-mono-bold text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-neon text-black border-neon glitch'
                      : 'bg-black text-electric border-electric hover:bg-electric hover:text-black'
                  }`}
                  data-text={tab.label}
                >
                  <Icon className="w-4 h-4 mr-2 inline" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ASCII Section Divider */}
        <div className="ascii-divider mb-6"></div>

        {/* Content Area */}
        <div className="brutal-card scanlines">
          <div className="p-6">
            {activeTab === 'direction' && <DirectionAnalyzer />}
            {activeTab === 'news' && <NewsAnalyzer />}
            {activeTab === 'perception' && <MarketPerceptionAnalyzer />}
            {activeTab === 'market' && <MarketOpeningTracker />}
          </div>
        </div>

        {/* ASCII Footer */}
        <div className="text-center mt-8">
          <div className="ascii-divider"></div>
          <p className="text-electric font-mono text-sm">
            >> AI_POWERED_MARKET_ANALYSIS // NEURAL_NETWORK_INSIGHTS
          </p>
          <div className="ascii-divider"></div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalytics;
