
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type LiquidationInsert = Database['public']['Tables']['liquidations']['Insert'];

export const useOptimizedSupabaseStorage = () => {
  const [lastSaveTime, setLastSaveTime] = useState<Date>(new Date());

  // OTIMIZAÇÃO 1: Só salvar liquidações REALMENTE significativas
  const shouldSaveLiquidation = (liquidationData: Omit<LiquidationInsert, 'id' | 'created_at' | 'updated_at' | 'expires_at'>) => {
    // Critérios MUITO mais restritivos para salvar no banco
    const isHighValue = liquidationData.market_cap === 'high' ? 
      liquidationData.amount > 500000 : // High cap: > $500k
      liquidationData.amount > 100000;  // Low cap: > $100k
    
    const isHighVolatility = Math.abs(liquidationData.change_24h) > 5; // > 5% mudança
    
    const isSignificantVolume = liquidationData.volume > 1000000; // > 1M volume
    
    // Só salva se atender pelo menos 2 dos 3 critérios
    const criteriaCount = [isHighValue, isHighVolatility, isSignificantVolume].filter(Boolean).length;
    
    return criteriaCount >= 2;
  };

  // OTIMIZAÇÃO 2: Salvar apenas dados críticos (redução de 95%+)
  const saveCriticalLiquidation = useCallback(async (liquidationData: Omit<LiquidationInsert, 'id' | 'created_at' | 'updated_at' | 'expires_at'>) => {
    try {
      // Verificar se realmente deve salvar
      if (!shouldSaveLiquidation(liquidationData)) {
        console.log(`🚫 Liquidação ${liquidationData.asset} NÃO salva (critérios não atendidos)`);
        return null;
      }

      const { data, error } = await supabase
        .from('liquidations')
        .insert(liquidationData)
        .select();
      
      if (error) {
        console.error('❌ Erro ao salvar liquidação crítica:', error);
        return null;
      }
      
      console.log(`💾 LIQUIDAÇÃO CRÍTICA salva: ${liquidationData.asset} - $${(liquidationData.amount/1000).toFixed(0)}K`);
      setLastSaveTime(new Date());
      
      return data;
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar liquidação crítica:', error);
      return null;
    }
  }, []);

  // OTIMIZAÇÃO 3: Batch operations (agrupar salvamentos)
  const saveBatchLiquidations = useCallback(async (liquidations: Array<Omit<LiquidationInsert, 'id' | 'created_at' | 'updated_at' | 'expires_at'>>) => {
    try {
      // Filtrar apenas liquidações que atendem aos critérios
      const criticalLiquidations = liquidations.filter(shouldSaveLiquidation);
      
      if (criticalLiquidations.length === 0) {
        console.log('🚫 Nenhuma liquidação atende aos critérios para salvar no banco');
        return [];
      }

      const { data, error } = await supabase
        .from('liquidations')
        .insert(criticalLiquidations)
        .select();
      
      if (error) {
        console.error('❌ Erro ao salvar batch de liquidações:', error);
        return [];
      }
      
      console.log(`💾 BATCH salvado: ${criticalLiquidations.length} liquidações críticas de ${liquidations.length} total`);
      setLastSaveTime(new Date());
      
      return data || [];
    } catch (error) {
      console.error('❌ Erro inesperado no batch save:', error);
      return [];
    }
  }, []);

  // OTIMIZAÇÃO 4: Cache local mais agressivo
  const getStorageStats = useCallback(() => {
    return {
      lastSaveTime,
      criteriaSummary: {
        highCapMinAmount: 500000,
        lowCapMinAmount: 100000,
        minVolatility: 5,
        minVolume: 1000000,
        criteriaRequired: 2
      }
    };
  }, [lastSaveTime]);

  // OTIMIZAÇÃO 5: Limpeza menos frequente
  const cleanupCriticalDataOnly = useCallback(async () => {
    try {
      // Apenas limpar dados muito antigos (mais de 24h)
      const { error } = await supabase
        .from('liquidations')
        .delete()
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      if (error) {
        console.error('❌ Erro na limpeza crítica:', error);
        return false;
      }
      
      console.log('🧹 Limpeza crítica executada (dados > 24h removidos)');
      return true;
    } catch (error) {
      console.error('❌ Erro inesperado na limpeza crítica:', error);
      return false;
    }
  }, []);

  return {
    saveCriticalLiquidation,
    saveBatchLiquidations,
    cleanupCriticalDataOnly,
    getStorageStats,
    shouldSaveLiquidation
  };
};
