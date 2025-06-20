
import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Settings, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useNotifications } from '../../hooks/useNotifications';
import { useRealFlowData } from '../../hooks/useRealFlowData';

interface NotificationSettings {
  volumeSpike: boolean;
  largeOrders: boolean;
  liquidations: boolean;
  minVolumeMultiplier: number;
  minOrderValue: number;
}

export const NotificationManager: React.FC = () => {
  const { sendNotification, permission, requestPermission } = useNotifications();
  const { alerts } = useRealFlowData();
  const [settings, setSettings] = useState<NotificationSettings>({
    volumeSpike: true,
    largeOrders: true,
    liquidations: true,
    minVolumeMultiplier: 3,
    minOrderValue: 500000
  });
  const [showSettings, setShowSettings] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!alerts || alerts.length === 0) return;

    const latestAlert = alerts[0];
    
    // Check if we should send notification based on settings
    const shouldNotify = 
      (settings.volumeSpike && latestAlert.type === 'unusual_volume') ||
      (settings.largeOrders && latestAlert.type === 'large_order') ||
      (settings.liquidations && latestAlert.type === 'liquidation');

    if (shouldNotify) {
      const title = `${latestAlert.type.toUpperCase().replace('_', ' ')} - ${latestAlert.ticker}`;
      const body = `Price: $${latestAlert.price.toFixed(4)} | Level: ${latestAlert.alert_level}/5`;
      
      sendNotification({
        title,
        body,
        icon: '/favicon.ico',
        tag: latestAlert.id,
        requireInteraction: latestAlert.alert_level >= 4
      });

      setNotificationCount(prev => prev + 1);
    }
  }, [alerts, settings, sendNotification]);

  const handleToggleSetting = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => permission !== 'granted' ? requestPermission() : setShowSettings(!showSettings)}
          className="relative"
        >
          {permission === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          {notificationCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              {notificationCount > 99 ? '99+' : notificationCount}
            </Badge>
          )}
        </Button>
        
        {permission === 'granted' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>

      {showSettings && (
        <div className="absolute top-12 right-0 z-50 bg-white border rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Notification Settings</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">Volume Spikes</label>
              <input
                type="checkbox"
                checked={settings.volumeSpike}
                onChange={() => handleToggleSetting('volumeSpike')}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Large Orders</label>
              <input
                type="checkbox"
                checked={settings.largeOrders}
                onChange={() => handleToggleSetting('largeOrders')}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Liquidations</label>
              <input
                type="checkbox"
                checked={settings.liquidations}
                onChange={() => handleToggleSetting('liquidations')}
                className="rounded"
              />
            </div>
            
            <div className="pt-2 border-t">
              <label className="text-sm block mb-2">Min Volume Multiplier: {settings.minVolumeMultiplier}x</label>
              <input
                type="range"
                min="2"
                max="10"
                value={settings.minVolumeMultiplier}
                onChange={(e) => setSettings(prev => ({ ...prev, minVolumeMultiplier: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm block mb-2">Min Order Value: ${(settings.minOrderValue / 1000).toFixed(0)}K</label>
              <input
                type="range"
                min="100000"
                max="2000000"
                step="100000"
                value={settings.minOrderValue}
                onChange={(e) => setSettings(prev => ({ ...prev, minOrderValue: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            {notificationCount} notifications sent this session
          </div>
        </div>
      )}
    </div>
  );
};
