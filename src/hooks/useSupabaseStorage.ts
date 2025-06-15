
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

  // Salvar liquidação no banco
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
      
      // Atualizar estatísticas do ativo
      await supabase.rpc('update_asset_statistics', { asset_name: liquidationData.asset });
      
      return data;
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar liquidação:', error);
      return null;
    }
  }, []);

  // Salvar dados do CoinTrendHunter
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
      
      // Atualizar estatísticas do ativo
      await supabase.rpc('update_asset_statistics', { asset_name: trendData.asset });
      
      return data;
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar trend:', error);
      return null;
    }
  }, []);

  // Buscar todas as liquidações
  const fetchLiquidations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('liquidations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar liquidações:', error);
        return;
      }
      
      setLiquidations(data || []);
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar liquidações:', error);
    }
  }, []);

  // Buscar todas as tendências
  const fetchCoinTrends = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('coin_trends')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar tendências:', error);
        return;
      }
      
      setCoinTrends(data || []);
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

  // Buscar liquidações por ativo
  const getLiquidationsByAsset = useCallback(async (asset: string) => {
    try {
      const { data, error } = await supabase
        .from('liquidations')
        .select('*')
        .eq('asset', asset)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
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

  // Buscar trends por ativo
  const getTrendsByAsset = useCallback(async (asset: string) => {
    try {
      const { data, error } = await supabase
        .from('coin_trends')
        .select('*')
        .eq('asset', asset)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
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

  // Buscar todos os ativos com atividade recente
  const getAllActiveAssets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('asset_statistics')
        .select('*')
        .eq('is_trending', true)
        .order('last_activity', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('❌ Erro ao buscar ativos ativos:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar ativos ativos:', error);
      return [];
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
    getAllActiveAssets
  };
};
