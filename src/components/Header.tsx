
import React from 'react';
import { Activity, BarChart3, Settings, Zap, TrendingUp } from 'lucide-react';

interface HeaderProps {
  activeTab: 'flow' | 'dashboard' | 'sentiment' | 'settings' | 'backtesting';
  onTabChange: (tab: 'flow' | 'dashboard' | 'sentiment' | 'settings' | 'backtesting') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'flow' as const, label: 'Live Flow', icon: Activity },
    { id: 'dashboard' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'sentiment' as const, label: 'Market Sentiment', icon: Zap },
    { id: 'backtesting' as const, label: 'Backtesting', icon: TrendingUp },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pinnacle AI Pro</h1>
                <p className="text-xs text-gray-500">Crypto Flow Intelligence System</p>
              </div>
            </div>
          </div>
          
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
