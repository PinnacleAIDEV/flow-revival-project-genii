
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { LiquidationRow } from './LiquidationRow';

interface LiquidationBubble {
  id: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  marketCap: 'high' | 'low';
  timestamp: Date;
  intensity: number;
  change24h: number;
  volume: number;
  lastUpdateTime: Date;
  totalLiquidated: number;
}

interface LiquidationTableProps {
  title: string;
  liquidations: LiquidationBubble[];
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  onAssetClick: (asset: string) => void;
}

export const LiquidationTable: React.FC<LiquidationTableProps> = ({
  title,
  liquidations,
  icon: Icon,
  bgColor,
  textColor,
  onAssetClick
}) => {
  return (
    <div className="flex-1 min-h-0">
      <div className={`p-3 ${bgColor} rounded-t-lg border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="w-5 h-5 text-white" />
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <span className="text-sm text-white/80">({liquidations.length})</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-b-lg">
        {liquidations.length > 0 ? (
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-20 font-bold">Asset</TableHead>
                  <TableHead className="w-24 font-bold">Price</TableHead>
                  <TableHead className="w-20 font-bold">24h %</TableHead>
                  <TableHead className="w-28 font-bold">Total Liq</TableHead>
                  <TableHead className="w-20 font-bold">Cap</TableHead>
                  <TableHead className="w-16 font-bold">Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liquidations.map((liquidation, index) => (
                  <LiquidationRow
                    key={liquidation.id}
                    liquidation={liquidation}
                    index={index}
                    textColor={textColor}
                    onAssetClick={onAssetClick}
                  />
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="h-[600px] flex items-center justify-center text-center">
            <div className="space-y-2">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto" />
              <h4 className="text-lg font-medium text-gray-600">No {title}</h4>
              <p className="text-gray-500 text-sm">Aguardando liquidações...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
