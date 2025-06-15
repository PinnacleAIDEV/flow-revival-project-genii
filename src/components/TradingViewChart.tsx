
import React, { useEffect, useRef } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

declare global {
  interface Window {
    TradingView: any;
  }
}

export const TradingViewChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || scriptLoadedRef.current) return;

    console.log('🔄 Carregando TradingView widget...');

    // Limpar conteúdo existente
    const container = containerRef.current;
    container.innerHTML = '';

    // Criar o div do widget
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    
    const widgetContent = document.createElement('div');
    widgetContent.className = 'tradingview-widget-container__widget';
    widgetContent.style.height = '100%';
    widgetContent.style.width = '100%';
    
    widgetDiv.appendChild(widgetContent);
    container.appendChild(widgetDiv);

    // Criar e configurar o script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    
    const config = {
      "autosize": true,
      "symbol": "BINANCE:BTCUSDT",
      "interval": "15",
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
      "container_id": "tradingview_widget",
      "width": "100%",
      "height": "100%"
    };

    script.innerHTML = JSON.stringify(config);
    
    script.onload = () => {
      console.log('✅ TradingView script carregado com sucesso');
      scriptLoadedRef.current = true;
    };
    
    script.onerror = () => {
      console.error('❌ Erro ao carregar TradingView script');
    };

    widgetDiv.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
      scriptLoadedRef.current = false;
    };
  }, []);

  return (
    <div className="h-full w-full relative bg-white">
      <div 
        ref={containerRef}
        id="tradingview_widget"
        className="h-full w-full"
      />
      
      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <BarChart3 className="w-12 h-12 text-blue-500 animate-pulse" />
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">TradingView Chart</h3>
            <p className="text-gray-600 max-w-md text-sm">
              Carregando gráfico profissional...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
