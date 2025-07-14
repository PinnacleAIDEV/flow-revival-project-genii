
import React from 'react';
import { OptimizedTrendReversalSection } from './OptimizedTrendReversalSection';
import { UnifiedTrendReversalAsset } from '../../types/trendReversal';

interface RealTrendReversalSectionProps {
  unifiedAssets: Map<string, UnifiedTrendReversalAsset>;
  onAssetClick: (asset: string) => void;
  isRealData: boolean;
  professionalData: boolean;
}

export const RealTrendReversalSection: React.FC<RealTrendReversalSectionProps> = ({
  unifiedAssets,
  onAssetClick,
  isRealData,
  professionalData
}) => {
  console.log(`🔄 REAL TREND REVERSAL usando detector otimizado - Sistema novo implementado`);
  
  return (
    <OptimizedTrendReversalSection 
      onAssetClick={onAssetClick}
    />
  );
};
