import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Download, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useSupabaseStorage } from '../hooks/useSupabaseStorage';
import type { Database } from '@/integrations/supabase/types';

type Liquidation = Database['public']['Tables']['liquidations']['Row'];
type CoinTrend = Database['public']['Tables']['coin_trends']['Row'];

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

  const formatAmount = (amount: number) => {
    if (!amount || isNaN(amount)) return '$0.00';
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '$0.00';
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Base de Dados</h1>
              <p className="text-sm lg:text-base text-gray-600">Histórico completo de liquidações e tendências</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Input
            type="text"
            placeholder="Buscar ativo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              variant="outline"
              onClick={() => downloadLiquidationsCSV()}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Exportar Liquidações</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadCoinTrendsCSV()}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Exportar Tendências</span>
            </Button>
          </div>
        </div>

        {/* Liquidations Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Histórico de Liquidações</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="py-3 px-3 text-left font-semibold min-w-[80px]">Ativo</th>
                    <th className="py-3 px-3 text-left font-semibold min-w-[60px]">Tipo</th>
                    <th className="py-3 px-3 text-right font-semibold min-w-[90px]">Valor</th>
                    <th className="py-3 px-3 text-right font-semibold min-w-[90px]">Preço</th>
                    <th className="py-3 px-3 text-center font-semibold min-w-[80px]">Cap</th>
                    <th className="py-3 px-3 text-center font-semibold min-w-[120px]">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLiquidations.map((liquidation) => (
                    <tr key={liquidation.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900 text-sm truncate max-w-[80px]">
                          {liquidation.asset}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {liquidation.type === 'long' ? (
                          <Badge variant="destructive" className="text-xs px-2 py-1">Long</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs px-2 py-1">Short</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono text-xs font-semibold text-gray-900">
                          {formatAmount(liquidation.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono text-xs text-gray-700">
                          {formatPrice(liquidation.price)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          liquidation.market_cap === 'high' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {liquidation.market_cap === 'high' ? 'HIGH' : 'LOW'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-xs text-gray-600">
                          {formatDate(liquidation.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredLiquidations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
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
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="py-3 px-3 text-left font-semibold min-w-[100px]">Ticker</th>
                    <th className="py-3 px-3 text-right font-semibold min-w-[100px]">Volume Spike</th>
                    <th className="py-3 px-3 text-center font-semibold min-w-[120px]">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCoinTrends.map((trend) => (
                    <tr key={trend.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-gray-900 text-sm">
                          {trend.ticker}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono text-sm font-semibold text-orange-600">
                          {trend.volume_spike}x
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-xs text-gray-600">
                          {formatDate(trend.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredCoinTrends.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500">
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
