import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { VolumeAlert } from '@/services/RealKlineVolumeService';

interface RealVolumeTableProps {
  data: VolumeAlert[];
  title: string;
  marketType: 'spot' | 'futures';
}

type SortField = 'timestamp' | 'volumeSpike' | 'priceMovement' | 'strength' | 'volume';
type SortDirection = 'asc' | 'desc';

export const RealVolumeTable: React.FC<RealVolumeTableProps> = ({ data, title, marketType }) => {
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStrength, setFilterStrength] = useState<string>('all');

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'spot_buy':
      case 'futures_long':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'spot_sell':
      case 'futures_short':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'spot_buy': return '📈 Spot Buy';
      case 'spot_sell': return '📉 Spot Sell';
      case 'futures_long': return '🚀 Long';
      case 'futures_short': return '📉 Short';
      default: return type;
    }
  };

  const getStrengthColor = (strength: number): string => {
    if (strength >= 5) return 'bg-red-500 text-white';
    if (strength >= 4) return 'bg-orange-500 text-white';
    if (strength >= 3) return 'bg-yellow-500 text-black';
    if (strength >= 2) return 'bg-blue-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtrar dados
  const filteredData = data.filter(item => {
    if (filterStrength === 'all') return true;
    return item.strength >= parseInt(filterStrength);
  });

  // Ordenar dados
  const sortedData = [...filteredData].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'timestamp') {
      aValue = a.timestamp.getTime();
      bValue = b.timestamp.getTime();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`;
    }
    return `$${volume.toFixed(0)}`;
  };

  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={filterStrength} onValueChange={setFilterStrength}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filtro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="2">Força ≥ 2</SelectItem>
              <SelectItem value="3">Força ≥ 3</SelectItem>
              <SelectItem value="4">Força ≥ 4</SelectItem>
              <SelectItem value="5">Força = 5</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="ml-2">
            {sortedData.length} alertas
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-pulse">
              <div className="text-2xl mb-2">📊</div>
              <p>Aguardando dados de volume real...</p>
              <p className="text-sm mt-1">Conectado aos streams klines da Binance</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('timestamp')}>
                      Tempo <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('volumeSpike')}>
                      Volume Spike <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('volume')}>
                      Volume <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('priceMovement')}>
                      Movimento <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Trades</TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('strength')}>
                      Força <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">
                      {formatTime(item.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{item.asset}</div>
                      <div className="text-xs text-muted-foreground">{item.ticker}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(item.type)}>
                        {getTypeLabel(item.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`font-bold ${item.volumeSpike >= 2 ? 'text-red-600' : item.volumeSpike >= 1.5 ? 'text-orange-600' : 'text-blue-600'}`}>
                          {item.volumeSpike.toFixed(2)}x
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatVolume(item.volume)}</div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center font-semibold ${
                        item.priceMovement >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.priceMovement >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {item.priceMovement.toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        ${item.price.toFixed(item.price >= 1 ? 4 : 6)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {item.trades.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStrengthColor(item.strength)}>
                        ⭐ {item.strength}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};