import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Volume2, AlertTriangle, Activity, Wifi, WifiOff, RefreshCw, Server } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFlowData } from '../hooks/useFlowData';

export const LiveFlowDashboard: React.FC = () => {
  const { 
    isConnected, 
    connectionError,
    connectionStatus,
    alerts, 
    flowData, 
    marketSentiment,
    reconnect 
  } = useFlowData();
  
  const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
  const [audioEnabled, setAudioEnabled] = useState(true);

  const timeframes = ['1m', '3m', '5m', '30m', '1h', '1d'];

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-100 text-green-700 border-green-200';
      case 'connecting': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-4 h-4" />;
      case 'connecting': return <RefreshCw className="w-4 h-4 animate-spin" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado ao Droplet';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Erro de Conexão';
      default: return 'Desconectado';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'unusual_volume':
        return <Volume2 className="w-4 h-4" />;
      case 'vwap_cross':
        return <Activity className="w-4 h-4" />;
      case 'climactic_move':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getAlertColor = (level: number) => {
    if (level >= 4) return 'bg-red-100 border-red-500 text-red-700';
    if (level >= 3) return 'bg-orange-100 border-orange-500 text-orange-700';
    if (level >= 2) return 'bg-yellow-100 border-yellow-500 text-yellow-700';
    return 'bg-blue-100 border-blue-500 text-blue-700';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pinnacle AI Pro</h1>
            <p className="text-gray-600 mt-1">Digital Ocean Flow Monitoring • IP: 157.245.240.29</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${getConnectionStatusColor()}`}>
              {getConnectionStatusIcon()}
              <span className="text-sm font-medium">{getConnectionStatusText()}</span>
            </div>
            
            <button
              onClick={reconnect}
              disabled={connectionStatus === 'connecting'}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
              <span>Reconectar</span>
            </button>
            
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                audioEnabled ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Audio {audioEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        
        {/* Connection Diagnostics */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium">Droplet Status</div>
                <div className="text-xs text-gray-500">IP: 157.245.240.29</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm font-medium">WebSocket</div>
                <div className="text-xs text-gray-500">
                  {window.location.protocol === 'https:' ? 'WSS:8443' : 'WS:8080'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-sm font-medium">Data Stream</div>
                <div className="text-xs text-gray-500">{flowData.length} símbolos</div>
              </div>
            </div>
          </div>
        </div>
        
        {connectionError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-800">Erro de Conexão com Droplet</p>
                <p className="text-sm text-red-600 mt-1">{connectionError}</p>
                <div className="mt-3 text-xs text-red-500">
                  <p><strong>Verificações necessárias:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Droplet está online e acessível (157.245.240.29)</li>
                    <li>WebSocket server rodando na porta 8080 (HTTP) ou 8443 (HTTPS)</li>
                    <li>Firewall permite conexões WebSocket</li>
                    <li>Se usar HTTPS, configure SSL/TLS no droplet</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Data Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Status Conexão</div>
          <div className="text-2xl font-bold text-gray-900">
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Símbolos Ativos</div>
          <div className="text-2xl font-bold text-gray-900">{flowData.length}</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Total Alertas</div>
          <div className="text-2xl font-bold text-gray-900">{alerts.length}</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Sentimento</div>
          <div className={`text-lg font-bold ${
            marketSentiment.score > 0 ? 'text-green-600' : 
            marketSentiment.score < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {marketSentiment.interpretation}
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Live Flow Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Dados em Tempo Real
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {flowData.length > 0 ? (
              flowData.map((data, index) => (
                <div key={`${data.ticker}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{data.ticker}</div>
                    <div className="text-sm text-gray-600">{data.exchange}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">${data.price.toFixed(4)}</div>
                    <div className={`text-sm ${data.change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.change_24h >= 0 ? '+' : ''}{data.change_24h.toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Vol: {data.volume.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">VWAP: ${data.vwap.toFixed(4)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500">
                  {connectionStatus === 'connecting' ? 
                    'Conectando ao droplet...' : 
                    connectionStatus === 'connected' ?
                    'Aguardando dados do droplet...' :
                    'Conecte ao droplet para ver dados em tempo real'
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Recent Alerts
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-4 ${getAlertColor(alert.alert_level)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getAlertIcon(alert.type)}
                      <span className="font-medium">{alert.ticker}</span>
                    </div>
                    <span className="text-sm">{alert.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <div>Type: {alert.type.replace('_', ' ')}</div>
                    <div>Level: {alert.alert_level}</div>
                    {alert.direction && <div>Direction: {alert.direction}</div>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum alerta ainda
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Market Flow Chart */}
      {flowData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preço de Movimento Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={flowData.slice(0, 20).reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ticker" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [formatPrice(value), 'Preço']}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
