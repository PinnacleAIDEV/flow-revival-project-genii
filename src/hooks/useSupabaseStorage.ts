
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type LiquidationInsert = Database['public']['Tables']['liquidations']['Insert'];
type CoinTrendInsert = Database['public']['Tables']['coin_trends']['Insert'];
type Liquidation = Database['public']['Tables']['liquidations']['Row'];
type CoinTrend = Database['public']['Tables']['coin_trends']['Row'];

export const useSupabaseStorage = () => {
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [coinTrends, setCoinTrends] = useState<CoinTrend[]>([]);

  // Salvar liquidação no banco com otimização
  const saveLiquidation = useCallback(async (liquidationData: Omit<LiquidationInsert, 'id' | 'created_at' | 'updated_at' | 'expires_at'>) => {
    try {
      const { data, error } = await supabase
        .from('liquidations')
        .insert(liquidationData)
        .select();
      
      if (error) {
        console.error('❌ Erro ao salvar liquidação:', error);
        return null;
      }
      
      console.log('💾 Liquidação salva no Supabase:', liquidationData.asset);
      
      // Usar função otimizada para atualizar estatísticas
      await supabase.rpc('update_asset_statistics', { asset_name: liquidationData.asset });
      
      return data;
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar liquidação:', error);
      return null;
    }
  }, []);

  // Salvar dados do CoinTrendHunter com otimização
  const saveCoinTrend = useCallback(async (trendData: Omit<CoinTrendInsert, 'id' | 'created_at' | 'updated_at' | 'expires_at'>) => {
    try {
      const { data, error } = await supabase
        .from('coin_trends')
        .insert(trendData)
        .select();
      
      if (error) {
        console.error('❌ Erro ao salvar trend:', error);
        return null;
      }
      
      console.log('💾 Trend salvo no Supabase:', trendData.asset);
      
      // Usar função otimizada para atualizar estatísticas
      await supabase.rpc('update_asset_statistics', { asset_name: trendData.asset });
      
      return data;
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar trend:', error);
      return null;
    }
  }, []);

  // Buscar liquidações com índices otimizados
  const fetchLiquidations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('liquidations')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) {
        console.error('❌ Erro ao buscar liquidações:', error);
        return;
      }
      
      setLiquidations(data || []);
      console.log(`📊 Carregadas ${data?.length || 0} liquidações ativas`);
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar liquidações:', error);
    }
  }, []);

  // Buscar tendências com índices otimizados
  const fetchCoinTrends = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('coin_trends')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) {
        console.error('❌ Erro ao buscar tendências:', error);
        return;
      }
      
      setCoinTrends(data || []);
      console.log(`📊 Carregadas ${data?.length || 0} tendências ativas`);
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar tendências:', error);
    }
  }, []);

  // Download CSV das liquidações
  const downloadLiquidationsCSV = useCallback(() => {
    if (liquidations.length === 0) {
      console.log('Nenhuma liquidação para exportar');
      return;
    }

    const headers = ['Asset', 'Type', 'Amount', 'Price', 'Market Cap', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...liquidations.map(liq => [
        liq.asset,
        liq.type,
        liq.amount,
        liq.price,
        liq.market_cap,
        liq.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liquidations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [liquidations]);

  // Download CSV das tendências
  const downloadCoinTrendsCSV = useCallback(() => {
    if (coinTrends.length === 0) {
      console.log('Nenhuma tendência para exportar');
      return;
    }

    const headers = ['Ticker', 'Volume Spike', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...coinTrends.map(trend => [
        trend.ticker,
        trend.volume_spike,
        trend.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coin_trends_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [coinTrends]);

  // Buscar liquidações por ativo usando índice otimizado
  const getLiquidationsByAsset = useCallback(async (asset: string) => {
    try {
      const { data, error } = await supabase
        .from('liquidations')
        .select('*')
        .eq('asset', asset)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('❌ Erro ao buscar liquidações:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar liquidações:', error);
      return [];
    }
  }, []);

  // Buscar trends por ativo usando índice otimizado
  const getTrendsByAsset = useCallback(async (asset: string) => {
    try {
      const { data, error } = await supabase
        .from('coin_trends')
        .select('*')
        .eq('asset', asset)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('❌ Erro ao buscar trends:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar trends:', error);
      return [];
    }
  }, []);

  // Buscar estatísticas de um ativo
  const getAssetStatistics = useCallback(async (asset: string) => {
    try {
      const { data, error } = await supabase
        .from('asset_statistics')
        .select('*')
        .eq('asset', asset)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Erro ao buscar estatísticas:', error);
        return null;
      }
      
      return data || null;
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar estatísticas:', error);
      return null;
    }
  }, []);

  // Usar nova função otimizada para buscar ativos ativos
  const getAllActiveAssets = useCallback(async (limitCount: number = 100) => {
    try {
      const { data, error } = await supabase
        .rpc('get_active_assets_optimized', { limit_count: limitCount });
      
      if (error) {
        console.error('❌ Erro ao buscar ativos ativos:', error);
        return [];
      }
      
      console.log(`📊 Carregados ${data?.length || 0} ativos ativos via função otimizada`);
      return data || [];
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar ativos ativos:', error);
      return [];
    }
  }, []);

  // Executar limpeza manual de dados expirados
  const cleanupExpiredData = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('cleanup_expired_data');
      
      if (error) {
        console.error('❌ Erro na limpeza de dados:', error);
        return false;
      }
      
      console.log('🧹 Limpeza de dados executada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro inesperado na limpeza:', error);
      return false;
    }
  }, []);

  return {
    liquidations,
    coinTrends,
    saveLiquidation,
    saveCoinTrend,
    fetchLiquidations,
    fetchCoinTrends,
    downloadLiquidationsCSV,
    downloadCoinTrendsCSV,
    getLiquidationsByAsset,
    getTrendsByAsset,
    getAssetStatistics,
    getAllActiveAssets,
    cleanupExpiredData
  };
};
