
-- Performance optimization for PostgreSQL (Final fixed version)
-- 1. Create performance indexes for frequent queries (without problematic predicates)

-- Index for liquidations table - most common queries
CREATE INDEX IF NOT EXISTS idx_liquidations_asset_expires ON public.liquidations(asset, expires_at);
CREATE INDEX IF NOT EXISTS idx_liquidations_created_at ON public.liquidations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_liquidations_type_asset ON public.liquidations(type, asset);
CREATE INDEX IF NOT EXISTS idx_liquidations_market_cap_amount ON public.liquidations(market_cap, amount DESC);
CREATE INDEX IF NOT EXISTS idx_liquidations_expires_at ON public.liquidations(expires_at) WHERE expires_at IS NOT NULL;

-- Index for coin_trends table
CREATE INDEX IF NOT EXISTS idx_coin_trends_asset_expires ON public.coin_trends(asset, expires_at);
CREATE INDEX IF NOT EXISTS idx_coin_trends_created_at ON public.coin_trends(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_trends_ticker_expires ON public.coin_trends(ticker, expires_at);
CREATE INDEX IF NOT EXISTS idx_coin_trends_expires_at ON public.coin_trends(expires_at) WHERE expires_at IS NOT NULL;

-- Index for asset_statistics table
CREATE INDEX IF NOT EXISTS idx_asset_statistics_trending_activity ON public.asset_statistics(is_trending, last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_asset_statistics_asset ON public.asset_statistics(asset);
CREATE INDEX IF NOT EXISTS idx_asset_statistics_last_activity ON public.asset_statistics(last_activity DESC);

-- 2. Optimize the cleanup function for better performance
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  deleted_liquidations INTEGER;
  deleted_trends INTEGER;
  deleted_stats INTEGER;
  cleanup_time TIMESTAMP WITH TIME ZONE;
BEGIN
  cleanup_time := now();
  
  -- Limpar liquidações expiradas (mais de 4 horas) - usando índice
  DELETE FROM public.liquidations 
  WHERE expires_at < cleanup_time;
  
  GET DIAGNOSTICS deleted_liquidations = ROW_COUNT;
  
  -- Limpar dados de trends expirados (mais de 4 horas) - usando índice
  DELETE FROM public.coin_trends 
  WHERE expires_at < cleanup_time;
  
  GET DIAGNOSTICS deleted_trends = ROW_COUNT;
  
  -- Atualizar estatísticas dos ativos (remover ativos sem atividade recente) - usando índice
  DELETE FROM public.asset_statistics 
  WHERE last_activity < (cleanup_time - interval '4 hours');
  
  GET DIAGNOSTICS deleted_stats = ROW_COUNT;
  
  -- Log da limpeza para monitoramento
  RAISE NOTICE 'Cleanup completed at %: Liquidations=%, Trends=%, Stats=%', 
    cleanup_time, deleted_liquidations, deleted_trends, deleted_stats;
    
  -- Analyze tables after cleanup for better query planning
  ANALYZE public.liquidations;
  ANALYZE public.coin_trends;
  ANALYZE public.asset_statistics;
END;
$function$;

-- 3. Optimize the update_asset_statistics function
CREATE OR REPLACE FUNCTION public.update_asset_statistics(asset_name text)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  ticker_name TEXT;
  long_total DECIMAL;
  short_total DECIMAL;
  vol_24h DECIMAL;
  avg_price_val DECIMAL;
  current_price_val DECIMAL;
  price_change DECIMAL;
  max_liq DECIMAL;
  liq_count INTEGER;
  anomaly_count INTEGER;
  avg_anomaly DECIMAL;
  market_cap_cat TEXT;
  exec_time TIMESTAMP WITH TIME ZONE;
BEGIN
  exec_time := now();
  
  -- Buscar dados do ticker com LIMIT para performance
  SELECT ticker INTO ticker_name 
  FROM public.liquidations 
  WHERE asset = asset_name AND expires_at > exec_time
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Calcular estatísticas de liquidações em uma única query otimizada
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'long' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'short' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(volume), 0),
    COALESCE(AVG(price), 0),
    COALESCE(MAX(price), 0),
    COALESCE(AVG(change_24h), 0),
    COALESCE(MAX(amount), 0),
    COUNT(*),
    COALESCE(MAX(market_cap), 'low')
  INTO long_total, short_total, vol_24h, avg_price_val, current_price_val, 
       price_change, max_liq, liq_count, market_cap_cat
  FROM public.liquidations 
  WHERE asset = asset_name AND expires_at > exec_time;
  
  -- Calcular estatísticas de anomalias otimizado
  SELECT 
    COUNT(*),
    COALESCE(AVG(anomaly_score), 0)
  INTO anomaly_count, avg_anomaly
  FROM public.coin_trends 
  WHERE asset = asset_name AND expires_at > exec_time;
  
  -- Usar UPSERT otimizado com ON CONFLICT
  INSERT INTO public.asset_statistics (
    asset, ticker, total_long_liquidations, total_short_liquidations,
    total_volume_24h, avg_price, current_price, price_change_24h,
    max_liquidation_amount, liquidation_count, anomaly_events_count,
    avg_anomaly_score, last_activity, market_cap_category, is_trending
  ) VALUES (
    asset_name, COALESCE(ticker_name, asset_name || 'USDT'), 
    long_total, short_total, vol_24h, avg_price_val, current_price_val,
    price_change, max_liq, liq_count, anomaly_count, avg_anomaly,
    exec_time, market_cap_cat, (liq_count > 0 OR anomaly_count > 0)
  )
  ON CONFLICT (asset) DO UPDATE SET
    ticker = EXCLUDED.ticker,
    total_long_liquidations = EXCLUDED.total_long_liquidations,
    total_short_liquidations = EXCLUDED.total_short_liquidations,
    total_volume_24h = EXCLUDED.total_volume_24h,
    avg_price = EXCLUDED.avg_price,
    current_price = EXCLUDED.current_price,
    price_change_24h = EXCLUDED.price_change_24h,
    max_liquidation_amount = EXCLUDED.max_liquidation_amount,
    liquidation_count = EXCLUDED.liquidation_count,
    anomaly_events_count = EXCLUDED.anomaly_events_count,
    avg_anomaly_score = EXCLUDED.avg_anomaly_score,
    last_activity = EXCLUDED.last_activity,
    market_cap_category = EXCLUDED.market_cap_category,
    is_trending = EXCLUDED.is_trending,
    updated_at = exec_time;
END;
$function$;

-- 4. Create a function to get active assets efficiently
CREATE OR REPLACE FUNCTION public.get_active_assets_optimized(limit_count integer DEFAULT 100)
RETURNS TABLE (
  asset text,
  ticker text,
  total_liquidations numeric,
  is_trending boolean,
  last_activity timestamp with time zone
)
LANGUAGE plpgsql
AS $function$
DECLARE
  cutoff_time TIMESTAMP WITH TIME ZONE;
BEGIN
  cutoff_time := now() - interval '2 hours';
  
  RETURN QUERY
  SELECT 
    s.asset,
    s.ticker,
    (s.total_long_liquidations + s.total_short_liquidations) as total_liquidations,
    s.is_trending,
    s.last_activity
  FROM public.asset_statistics s
  WHERE s.is_trending = true 
    AND s.last_activity > cutoff_time
  ORDER BY s.last_activity DESC, (s.total_long_liquidations + s.total_short_liquidations) DESC
  LIMIT limit_count;
END;
$function$;
