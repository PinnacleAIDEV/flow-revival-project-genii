
import React from 'react';
import { BacktestingPanel } from '../components/BacktestingPanel';

const Backtesting = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Strategy Backtesting</h1>
        <p className="text-gray-600 mt-1">Test and optimize your flow-based trading strategies</p>
      </div>
      <BacktestingPanel />
    </div>
  );
};

export default Backtesting;
