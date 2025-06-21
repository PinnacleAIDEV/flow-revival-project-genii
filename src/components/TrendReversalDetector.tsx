
// UPDATED: Now uses REAL liquidation data via droplet 157.245.240.29
import React from 'react';
import { RealTrendReversalDetector } from './RealTrendReversalDetector';

export const TrendReversalDetector: React.FC = () => {
  console.log('🔄 TrendReversalDetector now using REAL Force Order data via droplet 157.245.240.29');
  
  return <RealTrendReversalDetector />;
};
