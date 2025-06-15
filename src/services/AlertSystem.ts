
import { Alert } from './WebSocketService';

export interface AlertChannel {
  name: string;
  enabled: boolean;
  send: (alert: Alert) => Promise<void>;
}

class AlertSystem {
  private channels: AlertChannel[] = [];
  private alertHistory: Alert[] = [];
  private maxHistorySize = 1000;

  registerChannel(channel: AlertChannel) {
    this.channels.push(channel);
  }

  async sendAlert(alert: Alert) {
    // Adicionar ao histórico
    this.alertHistory.unshift(alert);
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.pop();
    }

    // Enviar para todos os canais habilitados
    const promises = this.channels
      .filter(channel => channel.enabled)
      .map(channel => channel.send(alert).catch(error => {
        console.error(`Failed to send alert via ${channel.name}:`, error);
      }));

    await Promise.all(promises);
  }

  getAlertHistory(limit?: number): Alert[] {
    return limit ? this.alertHistory.slice(0, limit) : this.alertHistory;
  }

  getAlertsByType(type: string, limit?: number): Alert[] {
    const filtered = this.alertHistory.filter(alert => alert.type === type);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  clearHistory() {
    this.alertHistory = [];
  }

  formatAlertMessage(alert: Alert): string {
    const emoji = this.getAlertEmoji(alert);
    const timestamp = alert.timestamp.toLocaleTimeString();
    
    switch (alert.type) {
      case 'unusual_volume':
        return `${emoji} [${timestamp}] VOLUME SPIKE: ${alert.ticker} - ${alert.details.change} above average! Price: $${alert.details.price}`;
      
      case 'vwap_cross':
        const direction = alert.direction === 'bullish' ? '🟢' : '🔴';
        return `${direction} [${timestamp}] VWAP CROSS: ${alert.ticker} - ${alert.details.direction} signal at $${alert.details.price}`;
      
      case 'climactic_move':
        const moveEmoji = alert.direction === 'up' ? '🚀' : '📉';
        return `${moveEmoji} [${timestamp}] CLIMACTIC MOVE: ${alert.ticker} - ${alert.details.direction} ${alert.details.priceChange} with ${alert.details.volumeSpike} volume`;
      
      default:
        return `${emoji} [${timestamp}] ALERT: ${alert.ticker} - ${alert.type}`;
    }
  }

  private getAlertEmoji(alert: Alert): string {
    switch (alert.alert_level) {
      case 5: return '🚨'; // Critical
      case 4: return '⚠️';  // High
      case 3: return '🔶'; // Medium
      case 2: return '🔵'; // Low
      default: return 'ℹ️'; // Minimal
    }
  }
}

// Implementações de canais específicos
export class WebSocketChannel implements AlertChannel {
  name = 'WebSocket';
  enabled = true;
  private connections: WebSocket[] = [];

  addConnection(ws: WebSocket) {
    this.connections.push(ws);
    ws.onclose = () => {
      const index = this.connections.indexOf(ws);
      if (index > -1) {
        this.connections.splice(index, 1);
      }
    };
  }

  async send(alert: Alert): Promise<void> {
    const message = JSON.stringify({
      type: 'flow_alert',
      data: alert
    });

    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

export class BrowserNotificationChannel implements AlertChannel {
  name = 'Browser Notification';
  enabled = false;

  constructor() {
    this.requestPermission();
  }

  private async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.enabled = permission === 'granted';
    }
  }

  async send(alert: Alert): Promise<void> {
    if (!this.enabled || !('Notification' in window)) {
      return;
    }

    const title = `AI PINNACLE - ${alert.type.toUpperCase()}`;
    const body = alertSystem.formatAlertMessage(alert);
    const icon = '/favicon.ico';

    new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: alert.id
    });
  }
}

export const alertSystem = new AlertSystem();

// Registrar apenas canais sem áudio
alertSystem.registerChannel(new WebSocketChannel());
alertSystem.registerChannel(new BrowserNotificationChannel());
