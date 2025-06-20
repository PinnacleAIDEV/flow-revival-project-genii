
import React from 'react';
import { useLiquidationData } from '../hooks/useLiquidationData';
import { LiveTotalSection } from './liquidation/LiveTotalSection';

export const LiveTotalDetector: React.FC = () => {
  const { longLiquidations, shortLiquidations } = useLiquidationData();

  return (
    <div className="h-[500px] scanlines">
      <LiveTotalSection 
        longLiquidations={longLiquidations}
        shortLiquidations={shortLiquidations}
      />
    </div>
  );
};
