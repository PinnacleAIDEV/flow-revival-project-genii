
-- Limpar todas as liquidações existentes para reduzir uso desnecessário do banco
DELETE FROM public.liquidations;

-- Limpar dados de trends também
DELETE FROM public.coin_trends;

-- Limpar estatísticas dos ativos
DELETE FROM public.asset_statistics;

-- Executar limpeza completa
SELECT public.cleanup_expired_data();
