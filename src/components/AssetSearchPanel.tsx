
import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Database, Clock } from 'lucide-react';
import { useSupabaseStorage } from '../hooks/useSupabaseStorage';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

export const AssetSearchPanel: React.FC = () => {
  const { searchAssets, getAssetStatistics, isStorageConnected } = useSupabaseStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [topAssets, setTopAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isStorageConnected) {
      loadTopAssets();
    }
  }, [isStorageConnected]);

  const loadTopAssets = async () => {
    setIsLoading(true);
    try {
      const data = await getAssetStatistics();
      setTopAssets(data.slice(0, 10));
    } catch (error) {
      console.error('Erro ao carregar top assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await searchAssets(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  if (!isStorageConnected) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-gray-400" />
            <span>Pesquisa de Ativos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-gray-500">
            <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Banco de dados não conectado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-blue-600" />
          <span>Pesquisa de Ativos</span>
          <Badge variant="outline" className="ml-auto">
            <Database className="w-3 h-3 mr-1" />
            4h Storage
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca */}
        <div className="flex space-x-2">
          <Input
            placeholder="Buscar ativo (ex: BTC, ETH...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Resultados da busca */}
        {searchResults.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Resultados da Busca</h4>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {searchResults.map((asset) => (
                  <div key={asset.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm">{asset.asset}</div>
                        <div className="text-xs text-gray-500">
                          {asset.liquidation_count} liquidações
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono">
                          ${asset.current_price?.toFixed(4)}
                        </div>
                        <div className={`text-xs ${asset.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatChange(asset.price_change_24h)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>Long: {formatAmount(asset.total_long_liquidations)}</span>
                      <span>Short: {formatAmount(asset.total_short_liquidations)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Top Ativos */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            Top Liquidações (4h)
          </h4>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">
                  Carregando...
                </div>
              ) : topAssets.length > 0 ? (
                topAssets.map((asset, index) => (
                  <div key={asset.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="font-bold text-sm">{asset.asset}</div>
                          <div className="text-xs text-gray-500">
                            {asset.liquidation_count} liquidações
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono">
                          ${asset.current_price?.toFixed(4)}
                        </div>
                        <div className={`text-xs ${asset.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatChange(asset.price_change_24h)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>Long: {formatAmount(asset.total_long_liquidations)}</span>
                      <span>Short: {formatAmount(asset.total_short_liquidations)}</span>
                    </div>
                    {asset.last_activity && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        Última atividade: {new Date(asset.last_activity).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Nenhum dado encontrado
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
