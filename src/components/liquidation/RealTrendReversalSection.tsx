
import React from 'react';
import { SimplifiedTrendReversalSection } from './SimplifiedTrendReversalSection';
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
  console.log(`🔄 REAL TREND REVERSAL usando detector simplificado - ${unifiedAssets.size} assets`);
  
  return (
    <SimplifiedTrendReversalSection 
      unifiedAssets={unifiedAssets}
      onAssetClick={onAssetClick}
      isRealData={isRealData}
      professionalData={professionalData}
    />
  );
};
