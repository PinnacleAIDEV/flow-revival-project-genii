
import React, { useState } from 'react';
import { Header } from '../components/Header';
import { FlowBuilder } from '../components/FlowBuilder';
import { NodePanel } from '../components/NodePanel';
import { Dashboard } from '../components/Dashboard';
import { LiveFlowDashboard } from '../components/LiveFlowDashboard';
import { MarketSentiment } from '../components/MarketSentiment';
import { FlowSettings } from '../components/FlowSettings';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'flow' | 'dashboard' | 'sentiment' | 'settings'>('flow');

  const renderContent = () => {
    switch (activeTab) {
      case 'flow':
        return <LiveFlowDashboard />;
      case 'dashboard':
        return <Dashboard />;
      case 'sentiment':
        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Market Sentiment Analysis</h1>
              <p className="text-gray-600 mt-1">Real-time crypto market sentiment and volume patterns</p>
            </div>
            <MarketSentiment />
          </div>
        );
      case 'settings':
        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
              <p className="text-gray-600 mt-1">Configure Pinnacle AI Pro flow monitoring settings</p>
            </div>
            <FlowSettings />
          </div>
        );
      default:
        return <LiveFlowDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
