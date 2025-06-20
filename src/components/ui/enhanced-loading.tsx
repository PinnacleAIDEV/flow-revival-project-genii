
import React from 'react';
import { Loader2, Activity, TrendingUp, Zap } from 'lucide-react';

interface EnhancedLoadingProps {
  type?: 'default' | 'data' | 'analysis' | 'connection';
  message?: string;
  progress?: number;
}

export const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({ 
  type = 'default', 
  message,
  progress 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'data':
        return <Activity className="w-8 h-8 text-blue-500 animate-pulse" />;
      case 'analysis':
        return <TrendingUp className="w-8 h-8 text-green-500 animate-bounce" />;
      case 'connection':
        return <Zap className="w-8 h-8 text-yellow-500 animate-spin" />;
      default:
        return <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />;
    }
  };

  const getMessage = () => {
    if (message) return message;
    
    switch (type) {
      case 'data':
        return 'Processing market data...';
      case 'analysis':
        return 'Analyzing volume patterns...';
      case 'connection':
        return 'Connecting to data stream...';
      default:
        return 'Loading...';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative">
        {getIcon()}
        {type === 'connection' && (
          <div className="absolute inset-0 border-2 border-yellow-500 rounded-full animate-ping opacity-20"></div>
        )}
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-gray-700 font-medium">{getMessage()}</p>
        
        {progress !== undefined && (
          <div className="w-48 mx-auto">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{Math.round(progress || 0)}%</p>
          </div>
        )}
      </div>
      
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export const DataStreamLoading: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-lg p-4 border animate-pulse">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    ))}
  </div>
);
