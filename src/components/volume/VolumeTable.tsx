
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { VolumeRow } from './VolumeRow';

interface VolumeData {
  id: string;
  symbol: string;
  volume: number;
  volumeSpike: number;
  price: number;
  change24h: number;
  exchange: string;
  timestamp: string;
  ticker: string;
  trades_count: number;
}

interface VolumeTableProps {
  data: VolumeData[];
  title: string;
}

export const VolumeTable: React.FC<VolumeTableProps> = ({ data, title }) => (
  <Card className="h-full bg-[#1C1C1E] border-[#2E2E2E] hover:border-[#00E0FF]/50 transition-all duration-300 backdrop-blur-sm">
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center space-x-2 text-[#F5F5F5] font-mono">
        <TrendingUp className="w-5 h-5 text-[#00E0FF]" />
        <span>{title}</span>
        <Badge className="bg-[#00E0FF]/20 text-[#00E0FF] border-[#00E0FF]/30">
          {data.length} assets
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-[#AAAAAA] uppercase bg-[#0A0A0A] border-b border-[#2E2E2E]">
            <tr>
              <th className="py-3 px-4 text-left font-semibold">Symbol</th>
              <th className="py-3 px-4 text-right font-semibold">Volume Spike</th>
              <th className="py-3 px-4 text-right font-semibold">Volume</th>
              <th className="py-3 px-4 text-right font-semibold">Price</th>
              <th className="py-3 px-4 text-right font-semibold">24h Change</th>
              <th className="py-3 px-4 text-center font-semibold">Exchange</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E2E2E]">
            {data.length > 0 ? data.map((item, index) => (
              <VolumeRow key={item.id} item={item} index={index} />
            )) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#AAAAAA]">
                  <div className="flex flex-col items-center space-y-2">
                    <TrendingUp className="w-8 h-8 text-[#00E0FF]/50" />
                    <span>Monitorando volume anormal...</span>
                    <span className="text-xs">Aguardando spikes de 3x+</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);
