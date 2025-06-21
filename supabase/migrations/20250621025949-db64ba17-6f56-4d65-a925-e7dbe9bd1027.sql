
-- Verificar se as tabelas ainda existem
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('liquidations', 'coin_trends', 'asset_statistics');

-- Verificar se há dados nas tabelas
SELECT 'liquidations' as table_name, COUNT(*) as row_count FROM public.liquidations
UNION ALL
SELECT 'coin_trends' as table_name, COUNT(*) as row_count FROM public.coin_trends
UNION ALL
SELECT 'asset_statistics' as table_name, COUNT(*) as row_count FROM public.asset_statistics;

-- Verificar se as funções ainda existem
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_asset_statistics', 'cleanup_expired_data', 'get_active_assets_optimized');

-- Verificar limites de uso do projeto
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public' 
  AND tablename IN ('liquidations', 'coin_trends', 'asset_statistics')
LIMIT 10;
