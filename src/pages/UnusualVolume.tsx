import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Activity, TrendingUp, Zap, AlertTriangle, Wifi, WifiOff, Clock, Target, BarChart3 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useMultiTimeframeVolume } from '@/hooks/useMultiTimeframeVolume';
import { MultiTimeframeVolumeTable } from '@/components/volume/MultiTimeframeVolumeTable';

const UnusualVolume = () => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use o novo hook multi-timeframe
  const { 
    spotBuyAlerts,
    spotSellAlerts,
    futuresLongAlerts,
    futuresShortAlerts,
    isConnected,
    connectionStatus,
    connectionInfo,
    stats,
    totalAlerts
  } = useMultiTimeframeVolume();

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
                <h1 className="text-xl font-semibold">Volume Multi-Timeframe</h1>
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
                  <p className="text-muted-foreground">Conectando aos streams multi-timeframe...</p>
                  <p className="text-sm text-muted-foreground mt-1">Status: {connectionStatus}</p>
                  {connectionInfo && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Spot: {connectionInfo.spotStatus} ({connectionInfo.spotSymbols} símbolos)</p>
                      <p>Futures: {connectionInfo.futuresStatus} ({connectionInfo.futuresSymbols} símbolos)</p>
                      <p>Timeframes: {connectionInfo.timeframes?.join(', ')}</p>
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
                Sistema Multi-Timeframe de Volume
              </CardTitle>
              <CardDescription>
                Detecção avançada de volumes anômalos em múltiplos timeframes com persistência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">🔗 Streams Ativos:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>{connectionInfo?.totalStreams || 0} streams simultâneos</li>
                    <li>{connectionInfo?.spotSymbols || 0} ativos spot</li>
                    <li>{connectionInfo?.futuresSymbols || 0} ativos futures</li>
                    <li>Reconexão automática</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">⏱️ Timeframes:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>1 minuto - ultra rápido</li>
                    <li>3 minutos - médio prazo</li>
                    <li>15 minutos - tendências</li>
                    <li>Análise simultânea</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🎯 Detecção:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Threshold 2x+ conservador</li>
                    <li>Baseline dinâmica (7 dias)</li>
                    <li>Classificação Buy/Sell/Long/Short</li>
                    <li>Força 1-5 inteligente</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🗄️ Persistência:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Supabase Pro otimizado</li>
                    <li>Cleanup automático 23:48 UTC</li>
                    <li>Histórico 24h por alerta</li>
                    <li>Anti-spam 5s por ticker</li>
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