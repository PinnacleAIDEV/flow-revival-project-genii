
// UPDATED: Now uses REAL liquidation data via droplet 157.245.240.29
import React from 'react';
import { RealLiquidationStats } from './RealLiquidationStats';

export const LiquidationStats: React.FC = () => {
  console.log('📊 LiquidationStats now using REAL Force Order data via droplet 157.245.240.29');
  
  return <RealLiquidationStats />;
};
