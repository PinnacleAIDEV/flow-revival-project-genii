
import { marketDataSimulator } from './MarketDataSimulator';

export interface FlowData {
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
  open: number;
  high: number;
  low: number;
  close: number;
  kline_volume?: number;
}

export interface Alert {
  id: string;
  type: 'unusual_volume' | 'vwap_cross' | 'climactic_move' | 'liquidation' | 'large_order';
  ticker: string;
  timestamp: Date;
  details: any;
  alert_level: number;
  direction?: 'bullish' | 'bearish' | 'up' | 'down';
  price: number;
  amount?: number;
}

class EnhancedWebSocketService {
  private messageHandlers: ((data: FlowData) => void)[] = [];
  private isSimulatorMode = true;
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private connectionError: string | null = null;

  async connect(): Promise<void> {
    console.log('🔌 Initializing Enhanced Market Data Connection...');
    this.connectionStatus = 'connecting';
    
    try {
      // Tentar conexão real primeiro (seu droplet)
      await this.tryRealConnection();
    } catch (error) {
      console.warn('⚠️ Real connection failed, switching to simulator mode');
      console.log('📊 Starting market data simulator...');
      
      this.startSimulatorMode();
    }
  }

  private async tryRealConnection() {
    // Simular tentativa de conexão real
    const dropletIP = '157.245.240.29';
    console.log(`🔍 Attempting connection to ${dropletIP}...`);
    
    // Para demonstração, sempre falha para usar o simulador
    // Em produção, aqui faria a conexão WebSocket real
    throw new Error('Real connection not available - using simulator');
  }

  private startSimulatorMode() {
    this.isSimulatorMode = true;
    this.connectionStatus = 'connected';
    this.connectionError = null;

    // Inscrever no simulador
    marketDataSimulator.subscribe((marketData) => {
      const flowData: FlowData = {
        ticker: marketData.symbol,
        price: marketData.price,
        volume: marketData.volume,
        timestamp: marketData.timestamp,
        exchange: 'Binance',
        bid: marketData.price * 0.9995,
        ask: marketData.price * 1.0005,
        change_24h: marketData.change24h,
        volume_24h: marketData.volume,
        vwap: marketData.vwap,
        trades_count: marketData.trades,
        open: marketData.price * 0.98,
        high: marketData.price * 1.02,
        low: marketData.price * 0.96,
        close: marketData.price
      };

      this.messageHandlers.forEach(handler => handler(flowData));
    });

    // Iniciar o simulador
    marketDataSimulator.start();

    // Simular eventos de mercado periodicamente
    setInterval(() => {
      const events = ['pump', 'dump', 'volatility'] as const;
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      
      if (Math.random() < 0.1) { // 10% chance a cada intervalo
        marketDataSimulator.triggerMarketEvent(randomEvent);
      }
    }, 30000); // A cada 30 segundos

    console.log('✅ Market Data Simulator connected successfully');
  }

  onMessage(handler: (data: FlowData) => void): void {
    this.messageHandlers.push(handler);
  }

  disconnect(): void {
    if (this.isSimulatorMode) {
      marketDataSimulator.stop();
    }
    this.messageHandlers = [];
    this.connectionStatus = 'disconnected';
    this.connectionError = null;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      error: this.connectionError,
      isSimulator: this.isSimulatorMode
    };
  }

  // Método para testar conexão
  async testConnection(): Promise<boolean> {
    return this.isSimulatorMode || this.connectionStatus === 'connected';
  }

  sendPing(): void {
    // No modo simulador, não precisa fazer nada
    if (this.isSimulatorMode) {
      console.log('📡 Simulator ping - connection healthy');
    }
  }
}

export const enhancedWebSocketService = new EnhancedWebSocketService();
