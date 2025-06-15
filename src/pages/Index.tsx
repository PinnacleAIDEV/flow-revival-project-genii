
import React, { useState } from 'react';
import { Header } from '../components/Header';
import { FlowBuilder } from '../components/FlowBuilder';
import { NodePanel } from '../components/NodePanel';
import { Dashboard } from '../components/Dashboard';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'flow' | 'dashboard'>('flow');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex">
        {activeTab === 'flow' ? (
          <>
            <NodePanel />
            <div className="flex-1">
              <FlowBuilder />
            </div>
          </>
        ) : (
          <div className="flex-1">
            <Dashboard />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
