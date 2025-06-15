
import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useTrading } from '../contexts/TradingContext';

declare global {
  interface Window {
    TradingView: any;
  }
}

export const TradingViewChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedAsset } = useTrading();

  useEffect(() => {
    const loadTradingViewWidget = () => {
      if (!containerRef.current) return;

      console.log(`🔄 Carregando TradingView widget para ${selectedAsset}...`);
      setIsLoading(true);
      setError(null);

      // Limpar container
      const container = containerRef.current;
      container.innerHTML = '';

      try {
        // Verificar se o script já foi carregado
        if (!document.querySelector('script[src*="tradingview.com"]')) {
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
          script.async = true;
          
          script.onload = () => {
            console.log('✅ Script TradingView carregado');
            initializeWidget();
          };
          
          script.onerror = () => {
            console.error('❌ Erro ao carregar script TradingView');
            setError('Erro ao carregar TradingView');
            setIsLoading(false);
          };

          document.head.appendChild(script);
        } else {
          // Script já carregado, inicializar widget diretamente
          initializeWidget();
        }
      } catch (err) {
        console.error('❌ Erro ao configurar TradingView:', err);
        setError('Erro na configuração');
        setIsLoading(false);
      }
    };

    const initializeWidget = () => {
      if (!containerRef.current) return;

      try {
        // Criar container do widget
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container';
        widgetContainer.style.height = '100%';
        widgetContainer.style.width = '100%';

        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container__widget';
        widgetDiv.style.height = '100%';
        widgetDiv.style.width = '100%';

        // Configuração do widget com 3min candles e VWAP
        const config = {
          autosize: true,
          symbol: `BINANCE:${selectedAsset}`,
          interval: '3', // 3 minutos
          timezone: 'America/Sao_Paulo',
          theme: 'light',
          style: '1', // Candles
          locale: 'pt_BR',
          enable_publishing: false,
          allow_symbol_change: true,
          calendar: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: 'tradingview_' + Date.now(),
          width: '100%',
          height: '100%',
          studies: [
            'VWAP@tv-basicstudies' // Adicionar VWAP por padrão
          ]
        };

        // Criar script com configuração
        const configScript = document.createElement('script');
        configScript.type = 'text/javascript';
        configScript.innerHTML = JSON.stringify(config);

        widgetContainer.appendChild(widgetDiv);
        widgetContainer.appendChild(configScript);
        
        containerRef.current.appendChild(widgetContainer);

        // Widget criado com sucesso
        setTimeout(() => {
          setIsLoading(false);
          console.log(`✅ Widget TradingView inicializado para ${selectedAsset}`);
        }, 2000);

      } catch (err) {
        console.error('❌ Erro ao inicializar widget:', err);
        setError('Erro na inicialização');
        setIsLoading(false);
      }
    };

    loadTradingViewWidget();

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [selectedAsset]); // Recarregar quando selectedAsset mudar

  return (
    <div className="h-full w-full relative bg-white">
      <div 
        ref={containerRef}
        className="h-full w-full"
      />
      
      {/* Loading/Error State */}
      {(isLoading || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <BarChart3 className={`w-12 h-12 text-blue-500 ${isLoading ? 'animate-pulse' : ''}`} />
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                TradingView Chart - {selectedAsset}
              </h3>
              {error ? (
                <p className="text-red-600 text-sm">{error}</p>
              ) : (
                <p className="text-gray-600 text-sm">
                  Carregando gráfico de 3min com VWAP...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
