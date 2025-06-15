
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
        // Criar container do widget
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container';
        widgetContainer.style.height = '100%';
        widgetContainer.style.width = '100%';

        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container__widget';
        widgetDiv.style.height = 'calc(100% - 32px)';
        widgetDiv.style.width = '100%';

        // Configuração do widget
        const config = {
          "autosize": true,
          "symbol": `BINANCE:${selectedAsset}`,
          "interval": "3",
          "timezone": "America/Sao_Paulo",
          "theme": "light",
          "style": "1",
          "locale": "pt_BR",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "calendar": false,
          "hide_top_toolbar": false,
          "hide_legend": false,
          "save_image": false,
          "container_id": "tradingview_" + Date.now(),
          "width": "100%",
          "height": "100%",
          "studies": [
            "VWAP@tv-basicstudies"
          ]
        };

        // Criar script com configuração correta
        const configScript = document.createElement('script');
        configScript.type = 'text/javascript';
        configScript.text = `
          new TradingView.widget(${JSON.stringify(config)});
        `;

        // Criar script do TradingView se não existir
        if (!document.querySelector('script[src*="tradingview.com"]')) {
          const tvScript = document.createElement('script');
          tvScript.type = 'text/javascript';
          tvScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
          tvScript.async = true;
          
          tvScript.onload = () => {
            console.log('✅ Script TradingView carregado');
            setTimeout(() => {
              widgetContainer.appendChild(widgetDiv);
              widgetContainer.appendChild(configScript);
              container.appendChild(widgetContainer);
              setIsLoading(false);
              console.log(`✅ Widget TradingView inicializado para ${selectedAsset}`);
            }, 1000);
          };
          
          tvScript.onerror = () => {
            console.error('❌ Erro ao carregar script TradingView');
            setError('Erro ao carregar TradingView');
            setIsLoading(false);
          };

          document.head.appendChild(tvScript);
        } else {
          // Script já carregado
          setTimeout(() => {
            widgetContainer.appendChild(widgetDiv);
            widgetContainer.appendChild(configScript);
            container.appendChild(widgetContainer);
            setIsLoading(false);
            console.log(`✅ Widget TradingView inicializado para ${selectedAsset}`);
          }, 1000);
        }

      } catch (err) {
        console.error('❌ Erro ao configurar TradingView:', err);
        setError('Erro na configuração');
        setIsLoading(false);
      }
    };

    loadTradingViewWidget();

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [selectedAsset]);

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
