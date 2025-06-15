
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TradingContextType {
  selectedAsset: string;
  setSelectedAsset: (asset: string) => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedAsset, setSelectedAsset] = useState('BTCUSDT');

  return (
    <TradingContext.Provider value={{ selectedAsset, setSelectedAsset }}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
