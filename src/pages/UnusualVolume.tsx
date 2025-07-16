
import React, { useState } from 'react';
import { ArrowLeft, Database, RefreshCw, Activity, BarChart3, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

import { EnhancedVolumeTable } from '../components/volume/EnhancedVolumeTable';
import { ErrorBoundary } from '../components/ui/error-boundary';
import { NotificationManager } from '../components/notifications/NotificationManager';
import { EnhancedLoading } from '../components/ui/enhanced-loading';
import { useVolumeDetector } from '../hooks/useVolumeDetector';

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
  type?: string;
  strength?: number;
  priceMovement?: number;
}

const UnusualVolume: React.FC = () => {
  const navigate = useNavigate();
  const { totalAlerts, spotAlerts, futuresAlerts, currentMode, isConnected, connectionStatus } = useVolumeDetector();
  
  const [lastUpdate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  // Converter alertas para formato da tabela
  const processedSpotData: VolumeData[] = spotAlerts.map(alert => ({
    id: alert.id,
    symbol: alert.asset,
    volume: alert.volume,
    volumeSpike: alert.volumeSpike,
    price: alert.price,
    change24h: alert.change24h,
    exchange: 'Binance',
    timestamp: alert.timestamp.toISOString(),
    ticker: alert.ticker,
    trades_count: 0,
    type: alert.type,
    strength: alert.strength,
    priceMovement: alert.priceMovement
  }));

  const processedFuturesData: VolumeData[] = futuresAlerts.map(alert => ({
    id: alert.id,
    symbol: alert.asset,
    volume: alert.volume,
    volumeSpike: alert.volumeSpike,
    price: alert.price,
    change24h: alert.change24h,
    exchange: 'Binance',
    timestamp: alert.timestamp.toISOString(),
    ticker: alert.ticker,
    trades_count: 0,
    type: alert.type,
    strength: alert.strength,
    priceMovement: alert.priceMovement
  }));

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
                    <Activity className="w-5 h-5 text-black" />
                    <div className="absolute inset-0 bg-[#00E0FF]/20 rounded-lg animate-pulse"></div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#F5F5F5] font-mono">WEBSOCKET VOLUME SCANNER ⚡</h2>
                    <div className="flex items-center space-x-4 text-sm text-[#AAAAAA]">
                      <span>WebSocket real-time via Digital Ocean droplet</span>
                      <div className="flex items-center space-x-1">
                        <Timer className="w-3 h-3" />
                        <span>Modo: <span className={`font-bold ${currentMode === 'spot' ? 'text-[#A6FF00]' : 'text-[#00E0FF]'}`}>{currentMode.toUpperCase()}</span> Focus</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationManager />
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

          {/* Loading State */}
          {connectionStatus === 'connecting' && (
            <EnhancedLoading 
              type="connection" 
              message="Conectando ao WebSocket Binance via Digital Ocean..."
            />
          )}

          {/* Statistics Summary */}
          {connectionStatus === 'connected' && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div className="bg-[#1C1C1E] border-[#2E2E2E] border rounded-lg p-4">
                <div className="text-[#AAAAAA] text-sm">VOLUME DATA</div>
                <div className="text-2xl font-mono font-bold text-[#A6FF00]">
                  REAL-TIME
                </div>
                <div className="text-[#AAAAAA] text-xs">Continuous Stream</div>
              </div>
              <div className="bg-[#1C1C1E] border-[#2E2E2E] border rounded-lg p-4">
                <div className="text-[#AAAAAA] text-sm">FOCUS MODE</div>
                <div className={`text-2xl font-mono font-bold ${currentMode === 'spot' ? 'text-[#A6FF00]' : 'text-[#00E0FF]'}`}>
                  {currentMode.toUpperCase()}
                </div>
                <div className="text-[#AAAAAA] text-xs">Alterna a cada 20s</div>
              </div>
              <div className="bg-[#1C1C1E] border-[#2E2E2E] border rounded-lg p-4">
                <div className="text-[#AAAAAA] text-sm">SPOT ALERTS</div>
                <div className="text-[#F5F5F5] text-2xl font-mono font-bold">{spotAlerts.length}</div>
                <div className="text-[#A6FF00] text-xs">
                  {spotAlerts.filter(a => a.type === 'spot_buy').length} BUY / {spotAlerts.filter(a => a.type === 'spot_sell').length} SELL
                </div>
              </div>
              <div className="bg-[#1C1C1E] border-[#2E2E2E] border rounded-lg p-4">
                <div className="text-[#AAAAAA] text-sm">FUTURES ALERTS</div>
                <div className="text-[#F5F5F5] text-2xl font-mono font-bold">{futuresAlerts.length}</div>
                <div className="text-[#00E0FF] text-xs">
                  {futuresAlerts.filter(a => a.type === 'futures_long').length} LONG / {futuresAlerts.filter(a => a.type === 'futures_short').length} SHORT
                </div>
              </div>
              <div className="bg-[#1C1C1E] border-[#2E2E2E] border rounded-lg p-4">
                <div className="text-[#AAAAAA] text-sm">THRESHOLD</div>
                <div className="text-[#F5F5F5] text-2xl font-mono font-bold">1.2X+</div>
                <div className="text-[#A6FF00] text-xs">WEBSOCKET SENSITIVE</div>
              </div>
              <div className="bg-[#1C1C1E] border-[#2E2E2E] border rounded-lg p-4">
                <div className="text-[#AAAAAA] text-sm">LATENCY</div>
                <div className="text-[#F5F5F5] text-2xl font-mono font-bold">&lt;1S</div>
                <div className="text-[#00E0FF] text-xs">REAL-TIME STREAM</div>
              </div>
              <div className="bg-[#1C1C1E] border-[#2E2E2E] border rounded-lg p-4">
                <div className="text-[#AAAAAA] text-sm">VOLUME SPIKES</div>
                <div className="text-[#F5F5F5] text-2xl font-mono font-bold">{totalAlerts}</div>
                <div className="text-[#A6FF00] text-xs">DETECTED</div>
              </div>
            </div>
          )}

          {/* WebSocket Volume Tables */}
          {connectionStatus === 'connected' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <EnhancedVolumeTable data={processedSpotData} title="WEBSOCKET SPOT ANOMALIES" />
              <EnhancedVolumeTable data={processedFuturesData} title="WEBSOCKET FUTURES ANOMALIES" />
            </div>
          ) : connectionStatus === 'error' ? (
            <div className="text-center py-12 text-red-400">
              <p>Erro na conexão WebSocket com Digital Ocean</p>
              <Button onClick={handleRefresh} className="mt-4">Reconectar WebSocket</Button>
            </div>
          ) : (
            <EnhancedLoading type="data" />
          )}

          {/* Info Panel */}
          <div className="mt-6 p-4 bg-[#1C1C1E]/50 rounded-lg border border-[#2E2E2E]">
            <div className="text-sm text-[#AAAAAA] space-y-2">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#00E0FF]" />
                <span className="text-[#00E0FF] font-semibold">WEBSOCKET REAL-TIME STRATEGY:</span>
              </div>
              <ul className="space-y-1 ml-6 text-xs">
                <li>• <strong>WebSocket Stream</strong>: Conexão direta via Digital Ocean droplet</li>
                <li>• <strong>Latência &lt;1s</strong>: Dados instantâneos sem delay de API calls</li>
                <li>• <strong>Threshold 1.2x</strong>: Ultra sensível para capturar micromovimentos</li>
                <li>• <strong>Smart Detection</strong>: Combina volume USD + contagem de trades</li>
                <li>• <strong>Anti-spam</strong>: Throttling de 30 segundos por ativo</li>
                <li>• <strong>Focus Mode</strong>: Alterna entre Spot/Futures a cada 20 segundos</li>
                <li>• <strong>Altcoin Season</strong>: 48+ ativos including PEPE, WIF, BONK</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default UnusualVolume;
