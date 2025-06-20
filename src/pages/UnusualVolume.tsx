
import React, { useState } from 'react';
import { ArrowLeft, Database, RefreshCw, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useRealFlowData } from '../hooks/useRealFlowData';
import { VolumeTable } from '../components/volume/VolumeTable';
import { VolumeDataProcessor } from '../components/volume/VolumeDataProcessor';
import { ErrorBoundary } from '../components/ui/error-boundary';
import { VolumeTableSkeleton } from '../components/ui/loading-skeleton';

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
  const { flowData, isConnected } = useRealFlowData();
  
  const [processedData, setProcessedData] = useState<ProcessedVolumeData>({
    spotVolume: [],
    futuresVolume: [],
    microcaps: []
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  const handleDataProcessed = (data: ProcessedVolumeData) => {
    setProcessedData(data);
    setLastUpdate(new Date());
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
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
                      <span>Rastreando spikes de volume 3x+ em tempo real</span>
                      <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>
                      <Badge className={`${isConnected ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                        {isConnected ? 'LIVE DATA' : 'DESCONECTADO'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
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

          {/* Volume Tables */}
          {!isConnected ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <VolumeTableSkeleton />
              <VolumeTableSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <VolumeTable data={processedData.spotVolume} title="SPOT UNUSUAL VOLUME" />
              <VolumeTable data={processedData.futuresVolume} title="FUTURES UNUSUAL VOLUME" />
            </div>
          )}

          {/* Microcaps */}
          {!isConnected ? (
            <VolumeTableSkeleton />
          ) : (
            <VolumeTable data={processedData.microcaps} title="MICROCAP NOTABLE VOLUME" />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default UnusualVolume;
