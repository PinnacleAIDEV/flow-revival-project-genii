
import React, { useState, useMemo } from 'react';
import { useRealLongLiquidations } from '../hooks/useRealLongLiquidations';
import { useRealShortLiquidations } from '../hooks/useRealShortLiquidations';
import { useTrading } from '../contexts/TradingContext';
import { RealTrendReversalSection } from './liquidation/RealTrendReversalSection';
import { UnifiedTrendReversalAsset } from '../types/trendReversal';

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

  // Create unified assets map with optimized processing
  const unifiedAssetsMap = useMemo(() => {
    const assetsMap = new Map<string, UnifiedTrendReversalAsset>();
    
    // Process REAL long liquidations
    longLiquidations.forEach(asset => {
      const unifiedAsset: UnifiedTrendReversalAsset = {
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
        liquidationHistory: asset.liquidationHistory.map((liq, index) => ({
          id: `${asset.asset}-long-${index}-${liq.timestamp.getTime()}`,
          type: liq.type,
          amount: liq.amount,
          timestamp: liq.timestamp,
          change24h: liq.change24h
        }))
      };
      assetsMap.set(asset.asset, unifiedAsset);
    });
    
    // Process REAL short liquidations and merge
    shortLiquidations.forEach(asset => {
      const existing = assetsMap.get(asset.asset);
      if (existing) {
        // Merge with existing long data
        const merged: UnifiedTrendReversalAsset = {
          ...existing,
          shortPositions: asset.shortPositions,
          shortLiquidated: asset.shortLiquidated,
          totalPositions: existing.longPositions + asset.shortPositions,
          combinedTotal: existing.longLiquidated + asset.shortLiquidated,
          dominantType: existing.longLiquidated > asset.shortLiquidated ? 'long' : 'short',
          lastUpdateTime: existing.lastUpdateTime > asset.lastUpdateTime ? existing.lastUpdateTime : asset.lastUpdateTime,
          liquidationHistory: [
            ...existing.liquidationHistory,
            ...asset.liquidationHistory.map((liq, index) => ({
              id: `${asset.asset}-short-${index}-${liq.timestamp.getTime()}`,
              type: liq.type,
              amount: liq.amount,
              timestamp: liq.timestamp,
              change24h: liq.change24h
            }))
          ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20) // Keep only recent 20 liquidations
        };
        assetsMap.set(asset.asset, merged);
      } else {
        // Add SHORT-only asset
        const unifiedAsset: UnifiedTrendReversalAsset = {
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
          liquidationHistory: asset.liquidationHistory.map((liq, index) => ({
            id: `${asset.asset}-short-${index}-${liq.timestamp.getTime()}`,
            type: liq.type,
            amount: liq.amount,
            timestamp: liq.timestamp,
            change24h: liq.change24h
          }))
        };
        assetsMap.set(asset.asset, unifiedAsset);
      }
    });

    console.log(`🔄 REAL Unified Assets processed: ${assetsMap.size}`);
    return assetsMap;
  }, [longLiquidations, shortLiquidations]);

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
