import React, { useState } from 'react';
import { ArrowLeft, Database, RefreshCw, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useRealFlowData } from '../hooks/useRealFlowData';
import { VolumeTable } from '../components/volume/VolumeTable';
import { VolumeDataProcessor } from '../components/volume/VolumeDataProcessor';
import { ErrorBoundary } from '../components/ui/error-boundary';
import { NotificationManager } from '../components/notifications/NotificationManager';
import { AdvancedFilters } from '../components/filters/AdvancedFilters';
import { EnhancedLoading } from '../components/ui/enhanced-loading';
import { FilterOptions } from '../hooks/useFilters';

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

interface ProcessedVolumeData {
  spotVolume: VolumeData[];
  futuresVolume: VolumeData[];
  microcaps: VolumeData[];
}

const UnusualVolume: React.FC = () => {
  const navigate = useNavigate();
  const { flowData, isConnected, connectionStatus } = useRealFlowData();
  
  const [processedData, setProcessedData] = useState<ProcessedVolumeData>({
    spotVolume: [],
    futuresVolume: [],
    microcaps: []
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    marketCap: 'all',
    timeframe: '5m',
    volumeThreshold: 3,
    priceChangeMin: -100,
    priceChangeMax: 100,
    exchange: 'all'
  });

  const handleDataProcessed = (data: ProcessedVolumeData) => {
    setProcessedData(data);
    setLastUpdate(new Date());
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleFiltersChange = (filters: FilterOptions) => {
    setActiveFilters(filters);
  };

  // Apply filters to data
  const applyFilters = (data: VolumeData[]) => {
    return data.filter(item => {
      // Market cap filter
      if (activeFilters.marketCap === 'high') {
        const highCapAssets = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE'];
        if (!highCapAssets.includes(item.symbol)) return false;
      } else if (activeFilters.marketCap === 'low') {
        const highCapAssets = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE'];
        if (highCapAssets.includes(item.symbol)) return false;
      }

      // Volume threshold filter
      if (item.volumeSpike < activeFilters.volumeThreshold) return false;

      // Price change filter
      if (item.change24h < activeFilters.priceChangeMin || item.change24h > activeFilters.priceChangeMax) {
        return false;
      }

      // Exchange filter
      if (activeFilters.exchange !== 'all' && 
          item.exchange.toLowerCase() !== activeFilters.exchange.toLowerCase()) {
        return false;
      }

      return true;
    });
  };

  const filteredData = {
    spotVolume: applyFilters(processedData.spotVolume),
    futuresVolume: applyFilters(processedData.futuresVolume),
    microcaps: applyFilters(processedData.microcaps)
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1C1C1E] to-[#0A0A0A]">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="p-4 border-b border-[#2E2E2E] bg-[#1C1C1E]/90 backdrop-blur-md rounded-t-2xl mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-2 border-[#2E2E2E] text-[#AAAAAA] hover:bg-[#2E2E2E] hover:border-[#00E0FF] hover:text-[#F5F5F5]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>VOLTAR</span>
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#00E0FF] to-[#A6FF00] rounded-lg flex items-center justify-center relative">
                    <Eye className="w-5 h-5 text-black" />
                    <div className="absolute inset-0 bg-[#00E0FF]/20 rounded-lg animate-pulse"></div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#F5F5F5] font-mono">UNUSUAL VOLUME MONITOR 💥</h2>
                    <div className="flex items-center space-x-4 text-sm text-[#AAAAAA]">
                      <span>Rastreando spikes de volume {activeFilters.volumeThreshold}x+ em tempo real</span>
                      <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>
                      <Badge className={`${isConnected ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                        {connectionStatus === 'connected' ? 'LIVE DATA' : connectionStatus.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationManager />
                <AdvancedFilters onFiltersChange={handleFiltersChange} />
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center space-x-2 border-[#2E2E2E] text-[#AAAAAA] hover:bg-[#2E2E2E] hover:border-[#00E0FF] hover:text-[#F5F5F5]"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>REFRESH</span>
                </Button>
                <Button
                  onClick={() => navigate('/database')}
                  variant="outline"
                  className="flex items-center space-x-2 border-[#2E2E2E] text-[#AAAAAA] hover:bg-[#2E2E2E] hover:border-[#00E0FF] hover:text-[#F5F5F5]"
                >
                  <Database className="w-4 h-4" />
                  <span>DATABASE</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Data Processor */}
          <VolumeDataProcessor 
            flowData={flowData} 
            onDataProcessed={handleDataProcessed}
          />

          {/* Loading State */}
          {connectionStatus === 'connecting' && (
            <EnhancedLoading 
              type="connection" 
              message="Conectando ao stream de dados da Binance..."
            />
          )}

          {/* Volume Tables */}
          {connectionStatus === 'connected' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <VolumeTable data={filteredData.spotVolume} title="SPOT UNUSUAL VOLUME" />
              <VolumeTable data={filteredData.futuresVolume} title="FUTURES UNUSUAL VOLUME" />
            </div>
          ) : connectionStatus === 'error' ? (
            <div className="text-center py-12 text-red-400">
              <p>Erro na conexão com dados em tempo real</p>
              <Button onClick={handleRefresh} className="mt-4">Tentar Novamente</Button>
            </div>
          ) : (
            <EnhancedLoading type="data" />
          )}

          {/* Microcaps */}
          {connectionStatus === 'connected' && (
            <VolumeTable data={filteredData.microcaps} title="MICROCAP NOTABLE VOLUME" />
          )}

          {/* Filter Summary */}
          {Object.values(activeFilters).some((value, index) => {
            const defaults: FilterOptions = {
              marketCap: 'all',
              timeframe: '5m',
              volumeThreshold: 3,
              priceChangeMin: -100,
              priceChangeMax: 100,
              exchange: 'all'
            };
            return value !== Object.values(defaults)[index];
          }) && (
            <div className="mt-6 p-4 bg-[#1C1C1E]/50 rounded-lg border border-[#2E2E2E]">
              <div className="text-sm text-[#AAAAAA]">
                <span className="text-[#00E0FF]">Filtros ativos:</span>
                {activeFilters.marketCap !== 'all' && <span className="ml-2 px-2 py-1 bg-blue-500/20 rounded text-blue-400">Market Cap: {activeFilters.marketCap}</span>}
                {activeFilters.volumeThreshold !== 3 && <span className="ml-2 px-2 py-1 bg-green-500/20 rounded text-green-400">Volume: {activeFilters.volumeThreshold}x+</span>}
                {(activeFilters.priceChangeMin !== -100 || activeFilters.priceChangeMax !== 100) && (
                  <span className="ml-2 px-2 py-1 bg-yellow-500/20 rounded text-yellow-400">
                    Price: {activeFilters.priceChangeMin}% - {activeFilters.priceChangeMax}%
                  </span>
                )}
                {activeFilters.exchange !== 'all' && <span className="ml-2 px-2 py-1 bg-purple-500/20 rounded text-purple-400">Exchange: {activeFilters.exchange}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default UnusualVolume;
