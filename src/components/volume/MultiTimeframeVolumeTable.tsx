import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiTimeframeAlert } from '@/services/MultiTimeframeVolumeService';
import { UnusualVolumeAlert } from '@/services/UnusualVolumeV2Service';

interface MultiTimeframeVolumeTableProps {
  data: MultiTimeframeAlert[] | UnusualVolumeAlert[];
  title: string;
  alertType: 'buy' | 'sell' | 'long' | 'short';
  marketType: 'spot' | 'futures';
}

type SortField = 'volumeMultiplier' | 'strength' | 'priceMovement' | 'timestamp' | 'timeframe';
type SortDirection = 'asc' | 'desc';

export const MultiTimeframeVolumeTable: React.FC<MultiTimeframeVolumeTableProps> = ({
  data,
  title,
  alertType,
  marketType
}) => {
  const [sortField, setSortField] = useState<SortField>('volumeMultiplier');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStrength, setFilterStrength] = useState<string>('all');
  const [filterTimeframe, setFilterTimeframe] = useState<string>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtrar dados com null safety
  let filteredData = (data || []).filter(item => 
    item && 
    item.strength && 
    item.timeframe && 
    typeof item.volumeMultiplier === 'number' && 
    !isNaN(item.volumeMultiplier)
  );
  
  if (filterStrength !== 'all') {
    const minStrength = parseInt(filterStrength);
    filteredData = filteredData.filter(item => item.strength >= minStrength);
  }
  
  if (filterTimeframe !== 'all') {
    filteredData = filteredData.filter(item => item.timeframe === filterTimeframe);
  }

  // Ordenar dados com null safety
  const sortedData = [...filteredData].sort((a, b) => {
    try {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'timestamp') {
        aValue = a.timestamp?.getTime() || 0;
        bValue = b.timestamp?.getTime() || 0;
      }
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    } catch (error) {
      console.warn('Sort error:', error);
      return 0;
    }
  });

  const getAlertTypeColor = (type: string) => {
    const colors = {
      buy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      sell: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      long: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      short: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 5) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (strength >= 4) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (strength >= 3) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (strength >= 2) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getTimeframeColor = (timeframe: string) => {
    const colors = {
      '1m': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      '3m': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      '15m': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
    };
    return colors[timeframe as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const formatVolume = (volume: number) => {
    if (!volume || isNaN(volume)) return '0';
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  const formatTime = (date: Date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '--:--:--';
      }
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return '--:--:--';
    }
  };

  const getTypeEmoji = (type: string) => {
    const emojis = {
      buy: '🟢',
      sell: '🔴',
      long: '📈',
      short: '📉'
    };
    return emojis[type as keyof typeof emojis] || '⚡';
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↗️' : '↘️';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getTypeEmoji(alertType)} {title}
            <Badge variant="outline" className="ml-2">
              {sortedData.length} alertas
            </Badge>
          </CardTitle>
          
          <div className="flex gap-2">
            <Select value={filterTimeframe} onValueChange={setFilterTimeframe}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="TF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="1m">1m</SelectItem>
                <SelectItem value="3m">3m</SelectItem>
                <SelectItem value="15m">15m</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStrength} onValueChange={setFilterStrength}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Força" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="5">⭐5</SelectItem>
                <SelectItem value="4">⭐4+</SelectItem>
                <SelectItem value="3">⭐3+</SelectItem>
                <SelectItem value="2">⭐2+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {sortedData.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Nenhum alerta {alertType} encontrado no momento
          </div>
        ) : (
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 w-20"
                    onClick={() => handleSort('timeframe')}
                  >
                    TF {getSortIcon('timeframe')}
                  </TableHead>
                  <TableHead className="w-24">Ativo</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 w-20"
                    onClick={() => handleSort('volumeMultiplier')}
                  >
                    Mult. {getSortIcon('volumeMultiplier')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 w-20"
                    onClick={() => handleSort('priceMovement')}
                  >
                    Preço% {getSortIcon('priceMovement')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 w-20"
                    onClick={() => handleSort('strength')}
                  >
                    Força {getSortIcon('strength')}
                  </TableHead>
                  <TableHead className="w-24">Volume</TableHead>
                  <TableHead className="w-20">Trades</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 w-20"
                    onClick={() => handleSort('timestamp')}
                  >
                    Hora {getSortIcon('timestamp')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((alert, index) => (
                  <TableRow key={`${alert.id || index}-${alert.timestamp?.getTime() || Date.now()}`} className="hover:bg-muted/50">
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getTimeframeColor(alert.timeframe)}
                      >
                        {alert.timeframe}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {alert.asset}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={alert.volumeMultiplier >= 5 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                                 alert.volumeMultiplier >= 3 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}
                      >
                        {(alert.volumeMultiplier || 0).toFixed(1)}x
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        (alert.priceMovement || 0) > 0 ? 'text-green-600 dark:text-green-400' : 
                        (alert.priceMovement || 0) < 0 ? 'text-red-600 dark:text-red-400' : 
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {(alert.priceMovement || 0) > 0 ? '+' : ''}{(alert.priceMovement || 0).toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={getStrengthColor(alert.strength)}
                      >
                        ⭐{alert.strength}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatVolume(alert.volumeCurrent)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(alert.tradesCount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTime(alert.timestamp)}
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