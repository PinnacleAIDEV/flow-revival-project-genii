import React, { useState, useEffect } from 'react';
import { Search, Database as DatabaseIcon, TrendingUp, TrendingDown, BarChart3, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseStorage } from '../hooks/useSupabaseStorage';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ScrollArea } from '../components/ui/scroll-area';
import type { Database } from '../integrations/supabase/types';

type AssetStatistics = Database['public']['Tables']['asset_statistics']['Row'];
type Liquidation = Database['public']['Tables']['liquidations']['Row'];
type CoinTrend = Database['public']['Tables']['coin_trends']['Row'];

export const AssetDatabase: React.FC = () => {
  const navigate = useNavigate();
  const { getAllActiveAssets, getLiquidationsByAsset, getTrendsByAsset, getAssetStatistics } = useSupabaseStorage();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAssets, setActiveAssets] = useState<AssetStatistics[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [assetLiquidations, setAssetLiquidations] = useState<Liquidation[]>([]);
  const [assetTrends, setAssetTrends] = useState<CoinTrend[]>([]);
  const [assetStats, setAssetStats] = useState<AssetStatistics | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar ativos ativos na inicialização
  useEffect(() => {
    loadActiveAssets();
  }, []);

  const loadActiveAssets = async () => {
    setLoading(true);
    try {
      const assets = await getAllActiveAssets();
      setActiveAssets(assets);
    } catch (error) {
      console.error('Erro ao carregar ativos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssetSelect = async (asset: string) => {
    setSelectedAsset(asset);
    setLoading(true);
    
    try {
      const [liquidations, trends, stats] = await Promise.all([
        getLiquidationsByAsset(asset),
        getTrendsByAsset(asset),
        getAssetStatistics(asset)
      ]);
      
      setAssetLiquidations(liquidations);
      setAssetTrends(trends);
      setAssetStats(stats);
    } catch (error) {
      console.error('Erro ao carregar dados do ativo:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const filteredAssets = activeAssets.filter(asset =>
    asset.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <DatabaseIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Base de Dados de Ativos</h1>
                <p className="text-gray-600">Histórico de liquidações e tendências • Reset diário 00:00 UTC</p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Reset Info */}
        <div className="mb-6">
          <DailyResetCounter />
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar ativo (ex: BTC, ETH, SOL...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Ativos */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Ativos Ativos ({filteredAssets.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {loading && !selectedAsset ? (
                      <div className="text-center py-8">Carregando...</div>
                    ) : (
                      filteredAssets.map((asset) => (
                        <div
                          key={asset.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedAsset === asset.asset
                              ? 'bg-blue-50 border-blue-200'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleAssetSelect(asset.asset)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-lg">{asset.asset}</div>
                              <div className="text-sm text-gray-500">{asset.ticker}</div>
                              <div className="text-xs text-gray-400">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {formatDate(asset.last_activity || asset.updated_at)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {formatAmount(asset.current_price)}
                              </div>
                              <div className={`text-xs ${
                                asset.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {asset.price_change_24h >= 0 ? '+' : ''}{asset.price_change_24h.toFixed(2)}%
                              </div>
                              <Badge variant={asset.market_cap_category === 'high' ? 'default' : 'secondary'}>
                                {asset.market_cap_category === 'high' ? 'High Cap' : 'Low Cap'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Detalhes do Ativo */}
          <div className="lg:col-span-2">
            {selectedAsset ? (
              <div className="space-y-6">
                {/* Estatísticas */}
                {assetStats && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedAsset} - Estatísticas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {formatAmount(Number(assetStats.total_long_liquidations))}
                          </div>
                          <div className="text-sm text-gray-600">Long Liquidations</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatAmount(Number(assetStats.total_short_liquidations))}
                          </div>
                          <div className="text-sm text-gray-600">Short Liquidations</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {assetStats.liquidation_count}
                          </div>
                          <div className="text-sm text-gray-600">Total Events</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {assetStats.avg_anomaly_score.toFixed(1)}/10
                          </div>
                          <div className="text-sm text-gray-600">Avg Anomaly</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Liquidações */}
                <Card>
                  <CardHeader>
                    <CardTitle>Liquidações Recentes ({assetLiquidations.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Intensidade</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assetLiquidations.map((liq) => (
                            <TableRow key={liq.id}>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  {liq.type === 'long' ? (
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                  ) : (
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                  )}
                                  <span className={liq.type === 'long' ? 'text-red-600' : 'text-green-600'}>
                                    {liq.type.toUpperCase()}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono">
                                {formatAmount(Number(liq.amount))}
                              </TableCell>
                              <TableCell className="font-mono">
                                ${Number(liq.price).toFixed(4)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{liq.intensity}/5</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {formatDate(liq.created_at)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Anomalias Detectadas ({assetTrends.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Vol Spike</TableHead>
                            <TableHead>Micro Cap</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assetTrends.map((trend) => (
                            <TableRow key={trend.id}>
                              <TableCell>
                                <span className={trend.type === 'long' ? 'text-red-600' : 'text-green-600'}>
                                  {trend.type.toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell className="font-mono">
                                {formatAmount(Number(trend.amount))}
                              </TableCell>
                              <TableCell>
                                <Badge variant={trend.anomaly_score >= 7 ? 'destructive' : trend.anomaly_score >= 4 ? 'secondary' : 'outline'}>
                                  {trend.anomaly_score}/10
                                </Badge>
                              </TableCell>
                              <TableCell className="font-bold text-orange-600">
                                {Number(trend.volume_spike).toFixed(1)}x
                              </TableCell>
                              <TableCell>
                                {trend.is_micro_cap && <Badge variant="outline">Micro</Badge>}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {formatDate(trend.created_at)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <DatabaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      Selecione um Ativo
                    </h3>
                    <p className="text-gray-500">
                      Escolha um ativo da lista para ver suas liquidações e anomalias
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDatabase;
