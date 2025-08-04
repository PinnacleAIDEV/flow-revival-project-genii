import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Activity, TrendingUp, Zap, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useRealVolumeDetector } from '@/hooks/useRealVolumeDetector';
import { RealVolumeTable } from '@/components/volume/RealVolumeTable';

const UnusualVolume = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use o novo hook de detecção real de volume
  const { 
    spotAlerts, 
    futuresAlerts, 
    isConnected,
    connectionStatus,
    connectionInfo,
    stats,
    totalAlerts
  } = useRealVolumeDetector();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold">Volume Anômalo Real-Time</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant={isConnected ? "default" : "destructive"}
                className="flex items-center gap-2"
              >
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {connectionStatus}
              </Badge>
              
              {connectionInfo && (
                <Badge variant="outline" className="text-xs">
                  {connectionInfo.totalSymbols} Assets
                </Badge>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Loading/Connection Status */}
          {!isConnected ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Conectando aos streams Binance...</p>
                  <p className="text-sm text-muted-foreground mt-1">Status: {connectionStatus}</p>
                  {connectionInfo && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Spot: {connectionInfo.spotConnected ? '✅' : '❌'} ({connectionInfo.spotSymbols} símbolos)</p>
                      <p>Futures: {connectionInfo.futuresConnected ? '✅' : '❌'} ({connectionInfo.futuresSymbols} símbolos)</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Estatísticas Resumidas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Alertas</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Spot Alerts</p>
                        <p className="text-2xl font-bold">{stats.spot}</p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Futures Alerts</p>
                        <p className="text-2xl font-bold">{stats.futures}</p>
                      </div>
                      <Zap className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">High Strength</p>
                        <p className="text-2xl font-bold">{stats.strong}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabelas de Volume Real */}
              <div className="space-y-6">
                <RealVolumeTable 
                  data={spotAlerts} 
                  title="🔵 Spot Volume Real-Time"
                  marketType="spot"
                />
                
                <RealVolumeTable 
                  data={futuresAlerts} 
                  title="🟠 Futures Volume Real-Time"
                  marketType="futures"
                />
              </div>
            </>
          )}

          {/* Painel de Informações Real */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Sistema Real de Klines & Volume
              </CardTitle>
              <CardDescription>
                Conectado diretamente aos streams Binance com dados klines em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">📊 Streams Klines Reais:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Spot: stream.binance.com klines 1m</li>
                    <li>Futures: fstream.binance.com klines 1m</li>
                    <li>Volume USD + trades weight real</li>
                    <li>Detecção ultra-agressiva: 1.05x threshold</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🚀 Cobertura Completa:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>150+ futures (memecoins, AI, gaming)</li>
                    <li>25+ spot prioritários</li>
                    <li>Sistema de força dinâmico (1-5)</li>
                    <li>Anti-spam: 10s cooldown por asset</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default UnusualVolume;