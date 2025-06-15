
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Volume2, AlertTriangle, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Alert {
  id: string;
  type: 'unusual_volume' | 'vwap_cross' | 'climactic_move';
  ticker: string;
  timestamp: Date;
  details: any;
  alert_level: number;
  direction?: 'bullish' | 'bearish' | 'up' | 'down';
}

interface FlowData {
  ticker: string;
  price: number;
  volume: number;
  timestamp: number;
  exchange: string;
  bid: number;
  ask: number;
  change_24h: number;
  volume_24h: number;
  vwap: number;
  trades_count: number;
}

export const LiveFlowDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [flowData, setFlowData] = useState<FlowData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const timeframes = ['1m', '3m', '5m', '30m', '1h', '1d'];

  useEffect(() => {
    // Simulação de conexão WebSocket com o droplet
    const connectToFlow = () => {
      console.log('Connecting to Pinnacle AI Pro Flow...');
      setIsConnected(true);

      // Simular dados em tempo real
      const interval = setInterval(() => {
        const mockAlert: Alert = {
          id: Date.now().toString(),
          type: Math.random() > 0.5 ? 'unusual_volume' : 'vwap_cross',
          ticker: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT'][Math.floor(Math.random() * 4)],
          timestamp: new Date(),
          details: {
            change: `${(Math.random() * 5 + 1).toFixed(1)}X`,
            price: (Math.random() * 50000 + 30000).toFixed(2),
            volume: (Math.random() * 1000000).toFixed(0)
          },
          alert_level: Math.floor(Math.random() * 5) + 1,
          direction: Math.random() > 0.5 ? 'bullish' : 'bearish'
        };

        handleNewAlert(mockAlert);
      }, 3000);

      return () => clearInterval(interval);
    };

    const cleanup = connectToFlow();
    return cleanup;
  }, []);

  const handleNewAlert = (alert: Alert) => {
    setAlerts(prev => [alert, ...prev].slice(0, 100));
    
    if (audioEnabled) {
      playAlertSound(alert.alert_level);
    }
  };

  const playAlertSound = (level: number) => {
    // Criar contexto de áudio para som de alerta
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800 + (level * 200), audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1 + (level * 0.02), audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pinnacle AI Pro</h1>
            <p className="text-gray-600 mt-1">Real-time Crypto Flow Monitoring System</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`px-4 py-2 rounded-lg transition-colors ${audioEnabled ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Audio {audioEnabled ? 'ON' : 'OFF'}
            </button>
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
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unusual Volume Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Volume2 className="w-5 h-5 mr-2 text-blue-600" />
            Unusual Volume
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.filter(a => a.type === 'unusual_volume').map((alert) => (
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
                  <div>Change: {alert.details.change}</div>
                  <div>Price: ${alert.details.price}</div>
                  <div>Volume: {alert.details.volume}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VWAP Crosses Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-600" />
            VWAP Crosses
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.filter(a => a.type === 'vwap_cross').map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border-l-4 ${getAlertColor(alert.alert_level)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {alert.direction === 'bullish' ? 
                      <TrendingUp className="w-4 h-4 text-green-600" /> : 
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    }
                    <span className="font-medium">{alert.ticker}</span>
                  </div>
                  <span className="text-sm">{alert.timestamp.toLocaleTimeString()}</span>
                </div>
                <div className="mt-2 text-sm">
                  <div>Trend: {alert.direction}</div>
                  <div>Price: ${alert.details.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Climactic Moves Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Climactic Moves
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.filter(a => a.type === 'climactic_move').map((alert) => (
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
                  <div>Direction: {alert.direction}</div>
                  <div>Change: {alert.details.change}</div>
                  <div>Volume: {alert.details.volume}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Overview Chart */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Flow Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={flowData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
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
    </div>
  );
};
