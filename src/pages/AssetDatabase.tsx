
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Download, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useSupabaseStorage } from '../hooks/useSupabaseStorage';
import { DailyResetCounter } from '../components/DailyResetCounter';

interface Liquidation {
  id: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  market_cap: string;
  timestamp: string;
}

interface CoinTrend {
  id: string;
  ticker: string;
  volume_spike: number;
  timestamp: string;
}

const AssetDatabase: React.FC = () => {
  const navigate = useNavigate();
  const { 
    liquidations, 
    coinTrends, 
    fetchLiquidations, 
    fetchCoinTrends,
    downloadLiquidationsCSV,
    downloadCoinTrendsCSV
  } = useSupabaseStorage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'long' | 'short'>('all');
  const [filteredLiquidations, setFilteredLiquidations] = useState<Liquidation[]>([]);
  const [filteredCoinTrends, setFilteredCoinTrends] = useState<CoinTrend[]>([]);

  useEffect(() => {
    fetchLiquidations();
    fetchCoinTrends();
  }, []);

  useEffect(() => {
    let filtered = liquidations;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.asset.toLowerCase().includes(lowerQuery) ||
        item.type.toLowerCase().includes(lowerQuery)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    setFilteredLiquidations(filtered);
  }, [liquidations, searchQuery, filterType]);

  useEffect(() => {
    let filteredTrends = coinTrends;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filteredTrends = filteredTrends.filter(item =>
        item.ticker.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredCoinTrends(filteredTrends);
  }, [coinTrends, searchQuery]);

  const handleDailyReset = async () => {
    console.log('🔄 Reset diário executado - recarregando dados...');
    await Promise.all([
      fetchLiquidations(),
      fetchCoinTrends()
    ]);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC'
    }) + ' UTC';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Base de Dados</h1>
              <p className="text-gray-600">Histórico completo de liquidações e tendências</p>
            </div>
          </div>
        </div>

        {/* Daily Reset Counter */}
        <DailyResetCounter onReset={handleDailyReset} showForceReset={false} />

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            type="text"
            placeholder="Buscar ativo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => downloadLiquidationsCSV()}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Liquidações</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadCoinTrendsCSV()}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Tendências</span>
            </Button>
          </div>
        </div>

        {/* Liquidations Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Histórico de Liquidações</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="py-3 px-4">Ativo</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Preço</th>
                    <th className="py-3 px-4">Market Cap</th>
                    <th className="py-3 px-4">Data/Hora (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLiquidations.map((liquidation) => (
                    <tr key={liquidation.id} className="bg-white border-b">
                      <td className="py-2 px-4 font-medium text-gray-900 whitespace-nowrap">
                        {liquidation.asset}
                      </td>
                      <td className="py-2 px-4">
                        {liquidation.type === 'long' ? (
                          <Badge variant="destructive">Long</Badge>
                        ) : (
                          <Badge variant="secondary">Short</Badge>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        {liquidation.amount.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </td>
                      <td className="py-2 px-4">${liquidation.price.toLocaleString()}</td>
                      <td className="py-2 px-4">{liquidation.market_cap}</td>
                      <td className="py-2 px-4">{formatDate(liquidation.timestamp)}</td>
                    </tr>
                  ))}
                  {filteredLiquidations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                        Nenhuma liquidação encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Coin Trends Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tendências de Moedas</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[600px]">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="py-3 px-4">Ticker</th>
                    <th className="py-3 px-4">Volume Spike</th>
                    <th className="py-3 px-4">Data/Hora (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoinTrends.map((trend) => (
                    <tr key={trend.id} className="bg-white border-b">
                      <td className="py-2 px-4 font-medium text-gray-900 whitespace-nowrap">
                        {trend.ticker}
                      </td>
                      <td className="py-2 px-4">{trend.volume_spike}</td>
                      <td className="py-2 px-4">{formatDate(trend.timestamp)}</td>
                    </tr>
                  ))}
                  {filteredCoinTrends.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 px-4 text-center text-gray-500">
                        Nenhuma tendência encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetDatabase;
