
// UPDATED: Now uses REAL liquidation data via droplet 157.245.240.29
import React from 'react';
import { RealLiquidationBubbleMap } from './RealLiquidationBubbleMap';

export const LiquidationBubble


: React.FC = () => {
  console.log('🔥 LiquidationBubbleMap now using REAL Force Order data via droplet 157.245.240.29');
  
  return <RealLiquidationBubbleMap />;
};
