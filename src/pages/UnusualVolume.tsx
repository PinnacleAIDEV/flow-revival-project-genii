import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Activity, TrendingUp, Zap, AlertTriangle, Wifi, WifiOff, Clock, Target, BarChart3 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useUnusualVolumeV2 } from '@/hooks/useUnusualVolumeV2';
import { MultiTimeframeVolumeTable } from '@/components/volume/MultiTimeframeVolumeTable';

const UnusualVolume = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use the new V2 hook
  const { 
    spotBuyAlerts,
    spotSellAlerts,
    futuresLongAlerts,
    futuresShortAlerts,
    isConnected,
    connectionStatus,
    connectionInfo,
    stats,
    totalAlerts,
    version
  } = useUnusualVolumeV2();

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
                <h1 className="text-xl font-semibold">Unusual Volume V2</h1>
                <Badge variant="outline" className="text-xs">
                  {version || 'V2'}
                </Badge>
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
                  {connectionInfo.totalStreams} Streams
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
                <p className="text-muted-foreground">Conectando ao Unusual Volume V2...</p>
                <p className="text-sm text-muted-foreground mt-1">Status: {connectionStatus}</p>
                {connectionInfo && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Version: {connectionInfo.version}</p>
                    <p>Spot: {connectionInfo.spotStatus} • Futures: {connectionInfo.futuresStatus}</p>
                    <p>Símbolos: {connectionInfo.symbols} • Streams: {connectionInfo.totalStreams}</p>
                    <p>Timeframes: 1m (real) + 3m, 15m (agregados)</p>
                  </div>
                )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Estatísticas por Categoria */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-sm font-medium text-muted-foreground">Total Alertas</p>
                        <p className="text-2xl font-bold text-foreground">{stats.total || 0}</p>
                      </div>
                      <Activity className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-sm font-medium text-muted-foreground">Spot Buy</p>
                        <p className="text-2xl font-bold text-foreground">{stats.spotBuy}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-emerald-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-sm font-medium text-muted-foreground">Spot Sell</p>
                        <p className="text-2xl font-bold text-foreground">{stats.spotSell}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-rose-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-sm font-medium text-muted-foreground">Futures Long</p>
                        <p className="text-2xl font-bold text-foreground">{stats.futuresLong}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-sky-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-sm font-medium text-muted-foreground">Futures Short</p>
                        <p className="text-2xl font-bold text-foreground">{stats.futuresShort}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-sm font-medium text-muted-foreground">High Strength</p>
                        <p className="text-2xl font-bold text-foreground">{stats.strong}</p>
                      </div>
                      <Zap className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Estatísticas por Timeframe */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-sm font-medium text-muted-foreground">1 Minuto</p>
                        <p className="text-2xl font-bold text-foreground">{stats.timeframes['1m'] || 0}</p>
                      </div>
                      <Clock className="h-8 w-8 text-indigo-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-sm font-medium text-muted-foreground">3 Minutos</p>
                        <p className="text-2xl font-bold text-foreground">{stats.timeframes['3m'] || 0}</p>
                      </div>
                      <Clock className="h-8 w-8 text-cyan-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-sm font-medium text-muted-foreground">15 Minutos</p>
                        <p className="text-2xl font-bold text-foreground">{stats.timeframes['15m'] || 0}</p>
                      </div>
                      <Clock className="h-8 w-8 text-teal-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabelas Split de Volume Multi-Timeframe */}
              <div className="space-y-6">
                {/* SPOT MARKET - Split Buy/Sell */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MultiTimeframeVolumeTable 
                    data={spotBuyAlerts} 
                    title="Spot Buy Alerts" 
                    alertType="buy"
                    marketType="spot"
                  />
                  
                  <MultiTimeframeVolumeTable 
                    data={spotSellAlerts} 
                    title="Spot Sell Alerts" 
                    alertType="sell"
                    marketType="spot"
                  />
                </div>
                
                {/* FUTURES MARKET - Split Long/Short */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MultiTimeframeVolumeTable 
                    data={futuresLongAlerts} 
                    title="Futures Long Alerts" 
                    alertType="long"
                    marketType="futures"
                  />
                  
                  <MultiTimeframeVolumeTable 
                    data={futuresShortAlerts} 
                    title="Futures Short Alerts" 
                    alertType="short"
                    marketType="futures"
                  />
                </div>
              </div>
            </>
          )}

          {/* Painel de Informações Multi-Timeframe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Unusual Volume V2 System
              </CardTitle>
              <CardDescription>
                Sistema otimizado com conexões 1m reais e agregação in-memory para 3m/15m
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">🔗 V2 Streams:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>{connectionInfo?.symbols || 20} símbolos focados</li>
                    <li>{connectionInfo?.totalStreams || 40} streams 1m</li>
                    <li>Apenas klines fechados</li>
                    <li>Reconexão inteligente</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">⏱️ Agregação:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>1m - WebSocket direto</li>
                    <li>3m - 3 klines agregados</li>
                    <li>15m - 15 klines agregados</li>
                    <li>Processamento in-memory</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🎯 Detecção V2:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Threshold 2.5x+ realista</li>
                    <li>Baseline estável (α=0.05)</li>
                    <li>Mínimo 3 amostras</li>
                    <li>Força baseada em volume + preço</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🛡️ Confiabilidade:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Validação NaN/zero</li>
                    <li>Anti-spam 10s melhorado</li>
                    <li>Filtros de dados malformados</li>
                    <li>Error boundaries integrados</li>
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

// Export default corrigido
export default UnusualVolume;