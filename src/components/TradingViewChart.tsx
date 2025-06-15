
import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { useTrading } from '../contexts/TradingContext';

declare global {
  interface Window {
    TradingView: any;
  }
}

export const TradingViewChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedAsset } = useTrading();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    console.log('📊 TradingView: Iniciando carregamento do widget');
    console.log('📊 TradingView: Asset selecionado:', selectedAsset);
    
    setIsLoading(true);
    setError(null);

    // Função para criar o widget
    const createWidget = () => {
      if (!containerRef.current) {
        console.error('❌ TradingView: Container não encontrado');
        setError('Container não encontrado');
        setIsLoading(false);
        return;
      }

      if (!window.TradingView) {
        console.error('❌ TradingView: Biblioteca não carregada');
        setError('Biblioteca TradingView não carregada');
        setIsLoading(false);
        return;
      }

      try {
        console.log('✅ TradingView: Criando widget para', selectedAsset);
        
        // Limpar container
        containerRef.current.innerHTML = '';
        
        // Criar widget
        new window.TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${selectedAsset}`,
          interval: '3',
          timezone: 'America/Sao_Paulo',
          theme: 'light',
          style: '1',
          locale: 'pt_BR',
          enable_publishing: false,
          allow_symbol_change: true,
          calendar: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerRef.current.id,
          width: '100%',
          height: '100%',
          studies: ['VWAP@tv-basicstudies'],
          loading_screen: { backgroundColor: '#ffffff' }
        });
        
        console.log('✅ TradingView: Widget criado com sucesso');
        setIsLoading(false);
        setError(null);
        
      } catch (err) {
        console.error('❌ TradingView: Erro ao criar widget:', err);
        setError('Erro ao criar widget');
        setIsLoading(false);
      }
    };

    // Verificar se o script já foi carregado
    const existingScript = document.querySelector('script[src*="tradingview.com"]');
    
    if (existingScript && window.TradingView) {
      console.log('✅ TradingView: Script já carregado');
      setScriptLoaded(true);
      setTimeout(createWidget, 500);
      return;
    }

    // Carregar script se não existir
    if (!existingScript) {
      console.log('📥 TradingView: Carregando script...');
      
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ TradingView: Script carregado');
        setScriptLoaded(true);
        setTimeout(createWidget, 1000);
      };
      
      script.onerror = () => {
        console.error('❌ TradingView: Erro ao carregar script');
        setError('Erro ao carregar script TradingView');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    } else {
      // Script existe mas TradingView não está disponível ainda
      console.log('⏳ TradingView: Aguardando biblioteca...');
      const checkTradingView = setInterval(() => {
        if (window.TradingView) {
          console.log('✅ TradingView: Biblioteca disponível');
          clearInterval(checkTradingView);
          setScriptLoaded(true);
          createWidget();
        }
      }, 500);
      
      // Timeout após 10 segundos
      setTimeout(() => {
        clearInterval(checkTradingView);
        if (!window.TradingView) {
          console.error('❌ TradingView: Timeout ao carregar biblioteca');
          setError('Timeout ao carregar TradingView');
          setIsLoading(false);
        }
      }, 10000);
    }

  }, [selectedAsset]);

  const uniqueId = `tradingview_${selectedAsset}_${Date.now()}`;

  return (
    <div className="h-full w-full relative bg-white">
      <div 
        ref={containerRef}
        id={uniqueId}
        className="h-full w-full"
      />
      
      {/* Loading/Error Overlay */}
      {(isLoading || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="text-center space-y-4 p-6">
            {error ? (
              <>
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-bold text-red-800 mb-2">
                    Erro no TradingView
                  </h3>
                  <p className="text-red-600 text-sm">{error}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Recarregar Página
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center space-x-2">
                  <BarChart3 className="w-12 h-12 text-blue-500 animate-pulse" />
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    TradingView Chart - {selectedAsset}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {scriptLoaded ? 'Criando gráfico...' : 'Carregando TradingView...'}
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    Gráfico de 3min com VWAP
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
