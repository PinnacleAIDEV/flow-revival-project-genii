
import React, { useState } from 'react';
import { Settings, Volume2, Bell, Activity, Save, RotateCcw } from 'lucide-react';

interface FlowSettingsConfig {
  volumeThreshold: number;
  vwapSensitivity: number;
  alertLevels: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  audioSettings: {
    enabled: boolean;
    volume: number;
  };
  timeframes: string[];
  maxAlertsPerMinute: number;
  retentionDays: {
    minuteData: number;
    hourlyData: number;
    dailyData: number;
  };
}

export const FlowSettings: React.FC = () => {
  const [config, setConfig] = useState<FlowSettingsConfig>({
    volumeThreshold: 2.0,
    vwapSensitivity: 0.1,
    alertLevels: {
      low: 1,
      medium: 3,
      high: 5,
      critical: 10
    },
    audioSettings: {
      enabled: true,
      volume: 0.7
    },
    timeframes: ['1m', '3m', '5m', '30m', '1h', '1d'],
    maxAlertsPerMinute: 100,
    retentionDays: {
      minuteData: 30,
      hourlyData: 365,
      dailyData: -1
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateConfig = (section: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof FlowSettingsConfig],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const updateDirectConfig = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    // Simular salvamento das configurações
    console.log('Saving configuration:', config);
    setHasChanges(false);
    // Aqui seria enviado para o backend
  };

  const resetToDefaults = () => {
    setConfig({
      volumeThreshold: 2.0,
      vwapSensitivity: 0.1,
      alertLevels: {
        low: 1,
        medium: 3,
        high: 5,
        critical: 10
      },
      audioSettings: {
        enabled: true,
        volume: 0.7
      },
      timeframes: ['1m', '3m', '5m', '30m', '1h', '1d'],
      maxAlertsPerMinute: 100,
      retentionDays: {
        minuteData: 30,
        hourlyData: 365,
        dailyData: -1
      }
    });
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Flow Configuration</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={saveSettings}
            disabled={!hasChanges}
            className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              hasChanges 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Detection Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Volume2 className="w-5 h-5 mr-2 text-purple-600" />
            Volume Detection
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume Threshold Multiplier
              </label>
              <input
                type="number"
                min="1"
                max="10"
                step="0.1"
                value={config.volumeThreshold}
                onChange={(e) => updateDirectConfig('volumeThreshold', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Volume must be X times average to trigger alert (current: {config.volumeThreshold}x)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VWAP Sensitivity
              </label>
              <input
                type="number"
                min="0.01"
                max="1"
                step="0.01"
                value={config.vwapSensitivity}
                onChange={(e) => updateDirectConfig('vwapSensitivity', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Price deviation from VWAP to trigger cross alerts
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Alerts Per Minute
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={config.maxAlertsPerMinute}
                onChange={(e) => updateDirectConfig('maxAlertsPerMinute', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Alert Levels */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-orange-600" />
            Alert Levels
          </h3>
          
          <div className="space-y-4">
            {Object.entries(config.alertLevels).map(([level, value]) => (
              <div key={level}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {level} Level Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={value}
                  onChange={(e) => updateConfig('alertLevels', level, parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Audio Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-600" />
            Audio & Notifications
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Enable Audio Alerts</span>
              <button
                onClick={() => updateConfig('audioSettings', 'enabled', !config.audioSettings.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.audioSettings.enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.audioSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audio Volume
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.audioSettings.volume}
                onChange={(e) => updateConfig('audioSettings', 'volume', parseFloat(e.target.value))}
                className="w-full"
                disabled={!config.audioSettings.enabled}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Silent</span>
                <span>{Math.round(config.audioSettings.volume * 100)}%</span>
                <span>Max</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Retention */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Retention</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minute Data (days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={config.retentionDays.minuteData}
                onChange={(e) => updateConfig('retentionDays', 'minuteData', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Data (days)
              </label>
              <input
                type="number"
                min="30"
                max="1000"
                value={config.retentionDays.hourlyData}
                onChange={(e) => updateConfig('retentionDays', 'hourlyData', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Data
              </label>
              <select
                value={config.retentionDays.dailyData}
                onChange={(e) => updateConfig('retentionDays', 'dailyData', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={-1}>Never Delete</option>
                <option value={730}>2 Years</option>
                <option value={1095}>3 Years</option>
                <option value={1825}>5 Years</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Active Timeframes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Timeframes</h3>
        <div className="flex flex-wrap gap-2">
          {['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => {
                const isActive = config.timeframes.includes(timeframe);
                if (isActive) {
                  updateDirectConfig('timeframes', config.timeframes.filter(t => t !== timeframe));
                } else {
                  updateDirectConfig('timeframes', [...config.timeframes, timeframe]);
                }
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                config.timeframes.includes(timeframe)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Select which timeframes should be monitored for alerts
        </p>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
            <span className="text-yellow-800 font-medium">
              You have unsaved changes. Click "Save Changes" to apply them.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
