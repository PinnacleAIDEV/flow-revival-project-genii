
// Utilitário para controlar a frequência de sinais por ativo
export class SignalThrottleManager {
  private static instance: SignalThrottleManager;
  private signalHistory: Map<string, Date> = new Map();
  private readonly THROTTLE_MINUTES = 5;

  private constructor() {}

  static getInstance(): SignalThrottleManager {
    if (!SignalThrottleManager.instance) {
      SignalThrottleManager.instance = new SignalThrottleManager();
    }
    return SignalThrottleManager.instance;
  }

  // Verifica se o ativo pode gerar um novo sinal
  canGenerateSignal(asset: string, patternType: string): boolean {
    const key = `${asset}-${patternType}`;
    const lastSignalTime = this.signalHistory.get(key);
    
    if (!lastSignalTime) {
      return true;
    }

    const now = new Date();
    const timeDiff = now.getTime() - lastSignalTime.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    const canGenerate = minutesDiff >= this.THROTTLE_MINUTES;
    
    if (canGenerate) {
      console.log(`✅ ${asset} pode gerar novo sinal ${patternType} (${minutesDiff.toFixed(1)} min desde último)`);
    } else {
      console.log(`⏳ ${asset} bloqueado para ${patternType} (${(this.THROTTLE_MINUTES - minutesDiff).toFixed(1)} min restantes)`);
    }

    return canGenerate;
  }

  // Registra que um sinal foi gerado
  recordSignal(asset: string, patternType: string): void {
    const key = `${asset}-${patternType}`;
    const now = new Date();
    this.signalHistory.set(key, now);
    
    console.log(`📝 Sinal registrado: ${asset} - ${patternType} às ${now.toLocaleTimeString()}`);
    
    // Limpar registros antigos (mais de 10 minutos)
    this.cleanOldRecords();
  }

  // Limpa registros antigos para economizar memória
  private cleanOldRecords(): void {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    
    let cleaned = 0;
    for (const [key, timestamp] of this.signalHistory.entries()) {
      if (timestamp < tenMinutesAgo) {
        this.signalHistory.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Limpou ${cleaned} registros antigos de sinais`);
    }
  }

  // Obtém estatísticas do throttling
  getStats(): { totalRecords: number; activeAssets: string[] } {
    const assets = Array.from(this.signalHistory.keys()).map(key => key.split('-')[0]);
    const uniqueAssets = [...new Set(assets)];
    
    return {
      totalRecords: this.signalHistory.size,
      activeAssets: uniqueAssets
    };
  }

  // Reset para testes (não usar em produção)
  reset(): void {
    this.signalHistory.clear();
    console.log('🔄 Signal throttle manager resetado');
  }
}

export const signalThrottleManager = SignalThrottleManager.getInstance();
