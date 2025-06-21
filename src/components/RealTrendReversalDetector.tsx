import React, { useState } from 'react';
import { useRealLongLiquidations } from '../hooks/useRealLongLiquidations';
import { useRealShortLiquidations } from '../hooks/useRealShortLiquidations';
import { useTrading } from '../contexts/TradingContext';
import { RealTrendReversalSection } from './liquidation/RealTrendReversalSection';

interface RealTrendReversalAsset {
  asset: string;
  ticker: string;
  price: number;
  marketCap: 'high' | 'low';
  
  // REAL combined data for analysis
  longPositions: number;
  longLiquidated: number;
  shortPositions: number;
  shortLiquidated: number;
  totalPositions: number;
  combinedTotal: number;
  dominantType: 'long' | 'short';
  
  // Temporal data
  lastUpdateTime: Date;
  firstDetectionTime: Date;
  
  // Analysis metrics
  intensity: number;
  
  // REAL combined history
  liquidationHistory: Array<{
    type: 'long' | 'short';
    amount: number;
    timestamp: Date;
    change24h: number;
  }>;
}

export const RealTrendReversalDetector: React.FC = () => {
  const { longLiquidations } = useRealLongLiquidations();
  const { shortLiquidations } = useRealShortLiquidations();
  const { setSelectedAsset } = useTrading();
  const [cardHeight, setCardHeight] = useState<1 | 2 | 3 | 4 | 5>(3);

  const handleAssetClick = (asset: string) => {
    const fullTicker = asset.includes('USDT') ? asset : `${asset}USDT`;
    setSelectedAsset(fullTicker);
    console.log(`🔄 REAL Trend Reversal selected: ${fullTicker}`);
  };

  // Create unified REAL assets map
  const unifiedAssetsMap = new Map<string, RealTrendReversalAsset>();
  
  // Process REAL long liquidations
  longLiquidations.forEach(asset => {
    const trendAsset: RealTrendReversalAsset = {
      asset: asset.asset,
      ticker: asset.ticker,
      price: asset.price,
      marketCap: asset.marketCap,
      longPositions: asset.longPositions,
      longLiquidated: asset.longLiquidated,
      shortPositions: 0,
      shortLiquidated: 0,
      totalPositions: asset.longPositions,
      combinedTotal: asset.longLiquidated,
      dominantType: 'long',
      lastUpdateTime: asset.lastUpdateTime,
      firstDetectionTime: asset.firstDetectionTime,
      intensity: asset.intensity,
      liquidationHistory: asset.liquidationHistory
    };
    unifiedAssetsMap.set(asset.asset, trendAsset);
  });
  
  // Process REAL short liquidations and merge if necessary
  shortLiquidations.forEach(asset => {
    const existing = unifiedAssetsMap.get(asset.asset);
    if (existing) {
      // MERGE: Keep data separated but create unified view
      const merged: RealTrendReversalAsset = {
        ...existing,
        shortPositions: asset.shortPositions,
        shortLiquidated: asset.shortLiquidated,
        totalPositions: existing.longPositions + asset.shortPositions,
        combinedTotal: existing.longLiquidated + asset.shortLiquidated,
        dominantType: existing.longLiquidated > asset.shortLiquidated ? 'long' : 'short',
        liquidationHistory: [...existing.liquidationHistory, ...asset.liquidationHistory],
        lastUpdateTime: existing.lastUpdateTime > asset.lastUpdateTime ? existing.lastUpdateTime : asset.lastUpdateTime
      };
      unifiedAssetsMap.set(asset.asset, merged);
    } else {
      // Add SHORT-only asset
      const trendAsset: RealTrendReversalAsset = {
        asset: asset.asset,
        ticker: asset.ticker,
        price: asset.price,
        marketCap: asset.marketCap,
        longPositions: 0,
        longLiquidated: 0,
        shortPositions: asset.shortPositions,
        shortLiquidated: asset.shortLiquidated,
        totalPositions: asset.shortPositions,
        combinedTotal: asset.shortLiquidated,
        dominantType: 'short',
        lastUpdateTime: asset.lastUpdateTime,
        firstDetectionTime: asset.firstDetectionTime,
        intensity: asset.intensity,
        liquidationHistory: asset.liquidationHistory
      };
      unifiedAssetsMap.set(asset.asset, trendAsset);
    }
  });

  const getCardHeight = () => {
    switch (cardHeight) {
      case 1: return 'h-[300px]';
      case 2: return 'h-[600px]';
      case 3: return 'h-[900px]';
      case 4: return 'h-[1200px]';
      case 5: return 'h-[1500px]';
      default: return 'h-[900px]';
    }
  };

  return (
    <div className={`${getCardHeight()} scanlines relative`}>
      {/* Height controls */}
      <div className="absolute top-2 right-2 z-10 flex space-x-1">
        {[1, 2, 3, 4, 5].map((size) => (
          <button
            key={size}
            onClick={() => setCardHeight(size as 1 | 2 | 3 | 4 | 5)}
            className={`w-6 h-6 text-xs rounded border ${
              cardHeight === size
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
            }`}
          >
            {size}x
          </button>
        ))}
      </div>

      <RealTrendReversalSection 
        unifiedAssets={unifiedAssetsMap}
        onAssetClick={handleAssetClick}
        isRealData={true}
        professionalData={true}
      />
    </div>
  );
};
