
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseStorage } from './useSupabaseStorage';

interface PerformanceMetrics {
  dbQueries: number;
  avgQueryTime: number;
  cacheHitRate: number;
  lastCleanup: Date | null;
  activeAssets: number;
  totalLiquidations: number;
  totalTrends: number;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    dbQueries: 0,
    avgQueryTime: 0,
    cacheHitRate: 0,
    lastCleanup: null,
    activeAssets: 0,
    totalLiquidations: 0,
    totalTrends: 0
  });

  const { getAllActiveAssets, liquidations, coinTrends, cleanupExpiredData } = useSupabaseStorage();

  // Monitorar métricas de performance
  const updateMetrics = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      // Buscar dados para calcular métricas
      const activeAssets = await getAllActiveAssets(50);

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      setMetrics(prev => ({
        ...prev,
        dbQueries: prev.dbQueries + 1,
        avgQueryTime: (prev.avgQueryTime + queryTime) / 2,
        activeAssets: activeAssets?.length || 0,
        totalLiquidations: liquidations?.length || 0,
        totalTrends: coinTrends?.length || 0
      }));

      console.log(`📊 Performance: ${queryTime.toFixed(2)}ms para buscar ativos ativos`);
    } catch (error) {
      console.error('❌ Erro ao monitorar performance:', error);
    }
  }, [getAllActiveAssets, liquidations, coinTrends]);

  // Executar limpeza automática
  const runCleanup = useCallback(async () => {
    try {
      const success = await cleanupExpiredData();
      if (success) {
        setMetrics(prev => ({
          ...prev,
          lastCleanup: new Date()
        }));
      }
    } catch (error) {
      console.error('❌ Erro na limpeza automática:', error);
    }
  }, [cleanupExpiredData]);

  // Executar limpeza a cada 30 minutos
  useEffect(() => {
    const cleanupInterval = setInterval(runCleanup, 30 * 60 * 1000);
    return () => clearInterval(cleanupInterval);
  }, [runCleanup]);

  // Atualizar métricas a cada 5 minutos
  useEffect(() => {
    updateMetrics(); // Executar imediatamente
    const metricsInterval = setInterval(updateMetrics, 5 * 60 * 1000);
    return () => clearInterval(metricsInterval);
  }, [updateMetrics]);

  return {
    metrics,
    updateMetrics,
    runCleanup
  };
};
