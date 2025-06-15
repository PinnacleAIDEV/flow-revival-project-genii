
import React, { useState } from 'react';
import { Settings, Volume2, Bell, Zap, Database } from 'lucide-react';

interface FlowConfig {
  droplet: {
    ip: string;
    private_ip: string;
    websocket_port: number;
  };
  flow_settings: {
    timeframes: string[];
    max_alerts_per_minute: number;
    volume_threshold_multiplier: number;
    vwap_sensitivity: number;
  };
  alerts: {
    audio_enabled: boolean;
    visual_highlight_duration: number;
    alert_levels: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
}

export const FlowSettings: React.FC = () => {
  const [config, setConfig] = useState<FlowConfig>({
    droplet: {
      ip: "157.245.240.29",
      private_ip: "10.116.0.3",
      websocket_port: 8080
    },
    flow_settings: {
      timeframes: ["1m", "3m", "5m", "30m", "1h", "1d"],
      max_alerts_per_minute: 100,
      volume_threshold_multiplier: 2.0,
      vwap_sensitivity: 0.1
    },
    alerts: {
      audio_enabled: true,
      visual_highlight_duration: 5000,
      alert_levels: {
        low: 1,
        medium: 3,
        high: 5,
        critical: 10
      }
    }
  });

  const handleSaveConfig = () => {
    console.log('Saving Pinnacle AI Pro configuration:', config);
    // Aqui você salvaria a configuração no backend
  };

  const updateConfig = (section: keyof FlowConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-blue-600" />
          Pinnacle AI Pro Configuration
        </h3>

        {/* Droplet Configuration */}
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
            <Database className="w-4 h-4 mr-2 text-green-600" />
            Droplet Connection
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public IP
              </label>
              <input
                type="text"
                value={config.droplet.ip}
                onChange={(e) => updateConfig('droplet', 'ip', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Private IP
              </label>
              <input
                type="text"
                value={config.droplet.private_ip}
                onChange={(e) => updateConfig('droplet', 'private_ip', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WebSocket Port
              </label>
              <input
                type="number"
                value={config.droplet.websocket_port}
                onChange={(e) => updateConfig('droplet', 'websocket_port', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Flow Settings */}
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
            <Zap className="w-4 h-4 mr-2 text-yellow-600" />
            Flow Detection Settings
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Alerts per Minute
              </label>
              <input
                type="number"
                value={config.flow_settings.max_alerts_per_minute}
                onChange={(e) => updateConfig('flow_settings', 'max_alerts_per_minute', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume Threshold Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                value={config.flow_settings.volume_threshold_multiplier}
                onChange={(e) => updateConfig('flow_settings', 'volume_threshold_multiplier', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VWAP Sensitivity
              </label>
              <input
                type="number"
                step="0.01"
                value={config.flow_settings.vwap_sensitivity}
                onChange={(e) => updateConfig('flow_settings', 'vwap_sensitivity', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Alert Settings */}
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
            <Bell className="w-4 h-4 mr-2 text-red-600" />
            Alert Configuration
          </h4>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.alerts.audio_enabled}
                onChange={(e) => updateConfig('alerts', 'audio_enabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Enable Audio Alerts
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visual Highlight Duration (ms)
              </label>
              <input
                type="number"
                value={config.alerts.visual_highlight_duration}
                onChange={(e) => updateConfig('alerts', 'visual_highlight_duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(config.alerts.alert_levels).map(([level, value]) => (
                <div key={level}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {level} Level
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => {
                      const newLevels = { ...config.alerts.alert_levels, [level]: parseInt(e.target.value) };
                      updateConfig('alerts', 'alert_levels', newLevels);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeframes */}
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-800 mb-4">
            Available Timeframes
          </h4>
          <div className="flex flex-wrap gap-2">
            {config.flow_settings.timeframes.map((timeframe, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {timeframe}
              </span>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveConfig}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            Save Configuration
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-green-600 font-medium">Droplet Connection</div>
            <div className="text-green-800 text-sm">Active</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-blue-600 font-medium">WebSocket</div>
            <div className="text-blue-800 text-sm">Connected</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-purple-600 font-medium">Flow Monitor</div>
            <div className="text-purple-800 text-sm">Running</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-yellow-600 font-medium">Alerts</div>
            <div className="text-yellow-800 text-sm">24 Today</div>
          </div>
        </div>
      </div>
    </div>
  );
};
