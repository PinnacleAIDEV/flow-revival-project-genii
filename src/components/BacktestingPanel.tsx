
import React, { useState } from 'react';
import { TrendingUp, BarChart3, Settings, Play, Pause, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BacktestConfig {
  strategy: 'volume_breakout' | 'vwap_momentum' | 'climactic_reversal';
  timeframe: string;
  volumeThreshold: number;
  stopLoss: number;
  takeProfit: number;
  maxPosition: number;
  startDate: string;
  endDate: string;
}

interface BacktestResult {
  totalTrades: number;
  winRate: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: Array<{
    entry: number;
    exit: number;
    pnl: number;
    duration: number;
  }>;
  equity: Array<{
    date: string;
    value: number;
  }>;
}

export const BacktestingPanel: React.FC = () => {
  const [config, setConfig] = useState<BacktestConfig>({
    strategy: 'volume_breakout',
    timeframe: '5m',
    volumeThreshold: 3.0,
    stopLoss: 2.0,
    takeProfit: 5.0,
    maxPosition: 10000,
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestResult | null>(null);

  const runBacktest = async () => {
    setIsRunning(true);
    
    // Simular execução de backtest
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Resultados simulados
    const mockResults: BacktestResult = {
      totalTrades: 156,
      winRate: 64.7,
      totalReturn: 23.5,
      maxDrawdown: -8.2,
      sharpeRatio: 1.85,
      trades: Array.from({ length: 20 }, (_, i) => ({
        entry: 45000 + Math.random() * 5000,
        exit: 45000 + Math.random() * 5000,
        pnl: (Math.random() - 0.4) * 1000,
        duration: Math.random() * 120 + 30
      })),
      equity: Array.from({ length: 50 }, (_, i) => ({
        date: `Day ${i + 1}`,
        value: 10000 + (Math.random() - 0.3) * i * 50
      }))
    };
    
    setResults(mockResults);
    setIsRunning(false);
  };

  const strategies = [
    { value: 'volume_breakout', label: 'Volume Breakout' },
    { value: 'vwap_momentum', label: 'VWAP Momentum' },
    { value: 'climactic_reversal', label: 'Climactic Reversal' }
  ];

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-blue-600" />
          Backtest Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Strategy</label>
            <select
              value={config.strategy}
              onChange={(e) => setConfig(prev => ({ ...prev, strategy: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {strategies.map(strategy => (
                <option key={strategy.value} value={strategy.value}>
                  {strategy.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
            <select
              value={config.timeframe}
              onChange={(e) => setConfig(prev => ({ ...prev, timeframe: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1m">1 Minute</option>
              <option value="3m">3 Minutes</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="30m">30 Minutes</option>
              <option value="1h">1 Hour</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Volume Threshold</label>
            <input
              type="number"
              min="1"
              max="10"
              step="0.1"
              value={config.volumeThreshold}
              onChange={(e) => setConfig(prev => ({ ...prev, volumeThreshold: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stop Loss (%)</label>
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.1"
              value={config.stopLoss}
              onChange={(e) => setConfig(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Take Profit (%)</label>
            <input
              type="number"
              min="1"
              max="20"
              step="0.1"
              value={config.takeProfit}
              onChange={(e) => setConfig(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Position ($)</label>
            <input
              type="number"
              min="1000"
              max="100000"
              step="1000"
              value={config.maxPosition}
              onChange={(e) => setConfig(prev => ({ ...prev, maxPosition: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-6">
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={config.endDate}
                onChange={(e) => setConfig(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={runBacktest}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors ${
              isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Running...' : 'Run Backtest'}</span>
          </button>
        </div>
      </div>

      {/* Results Panel */}
      {results && (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{results.totalTrades}</div>
                <div className="text-sm text-gray-600">Total Trades</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.winRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Win Rate</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">+{results.totalReturn.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Total Return</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.maxDrawdown.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Max Drawdown</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{results.sharpeRatio.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Sharpe Ratio</div>
              </div>
            </div>
          </div>

          {/* Equity Curve */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Equity Curve
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={results.equity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Portfolio Value']} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#059669" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Trade Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Recent Trades
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Entry</th>
                    <th className="text-left py-2">Exit</th>
                    <th className="text-left py-2">P&L</th>
                    <th className="text-left py-2">Duration (min)</th>
                    <th className="text-left py-2">Return %</th>
                  </tr>
                </thead>
                <tbody>
                  {results.trades.slice(0, 10).map((trade, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2">${trade.entry.toFixed(2)}</td>
                      <td className="py-2">${trade.exit.toFixed(2)}</td>
                      <td className={`py-2 ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${trade.pnl.toFixed(2)}
                      </td>
                      <td className="py-2">{trade.duration.toFixed(0)}</td>
                      <td className={`py-2 ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {((trade.exit - trade.entry) / trade.entry * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
