
import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Clock, Filter } from 'lucide-react';
import { useRealFlowData } from '../../hooks/useRealFlowData';

interface LargeOrder {
  id: string;
  asset: string;
  type: 'buy' | 'sell';
  price: number;
  volume: number;
  value: number;
  timestamp: Date;
}

export const LargeOrderSection: React.FC = () => {
  const { flowData } = useRealFlowData();
  const [largeOrders, setLargeOrders] = useState<LargeOrder[]>([]);
  const [filter200M, setFilter200M] = useState(false);

  useEffect(() => {
    // Detectar ordens grandes baseado em volume * preço > $1M
    flowData.forEach(data => {
      const orderValue = data.volume * data.price;
      
      // Considerar ordem grande se valor > $1M USD
      if (orderValue > 1000000) {
        const newOrder: LargeOrder = {
          id: `${data.ticker}-${data.timestamp}`,
          asset: data.ticker.replace('USDT', ''),
          type: data.change_24h >= 0 ? 'buy' : 'sell',
          price: data.price,
          volume: data.volume,
          value: orderValue,
          timestamp: new Date(data.timestamp)
        };
        
        setLargeOrders(prev => {
          // Evitar duplicatas e manter apenas últimas 50 ordens
          const exists = prev.some(order => order.id === newOrder.id);
          if (!exists) {
            return [newOrder, ...prev.slice(0, 49)];
          }
          return prev;
        });
      }
    });
  }, [flowData]);

  // Filter orders based on 200M filter
  const filteredOrders = filter200M 
    ? largeOrders.filter(order => order.value > 200000000) // > $200M
    : largeOrders;

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(6)}`;
  };

  const formatValue = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s atrás`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    return `${Math.floor(diffInSeconds / 3600)}h atrás`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Large Orders</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500 bg-purple-50 px-2 py-1 rounded">{'>'} $1M</div>
          <div className="flex items-center space-x-1">
            <Filter className="w-4 h-4 text-gray-500" />
            <label className="flex items-center space-x-1 text-sm">
              <input
                type="checkbox"
                checked={filter200M}
                onChange={(e) => setFilter200M(e.target.checked)}
                className="w-3 h-3 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-gray-600">{'>'} $200M</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-2">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`p-4 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md ${
                order.type === 'buy' 
                  ? 'bg-gradient-to-r from-green-50 to-green-25 border-green-500' 
                  : 'bg-gradient-to-r from-red-50 to-red-25 border-red-500'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {order.type === 'buy' ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-bold text-gray-900 text-lg">{order.asset}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    order.type === 'buy' 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {order.type === 'buy' ? 'LARGE BUY' : 'LARGE SELL'}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeAgo(order.timestamp)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preço:</span>
                    <span className="font-bold text-gray-900">{formatPrice(order.price)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volume:</span>
                    <span className="font-medium text-gray-700">{formatVolume(order.volume)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-bold text-purple-600">{formatValue(order.value)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className={`text-xs font-medium ${
                      order.type === 'buy' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {order.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-center py-12">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Monitoring Orders</h4>
                <p className="text-gray-500 text-sm max-w-xs">
                  {filter200M 
                    ? 'Aguardando ordens únicas maiores que $200M USD...' 
                    : 'Aguardando ordens únicas maiores que $1M USD...'
                  }
                </p>
                <div className="mt-3 text-xs text-purple-600">
                  Volume × Preço {'>'} {filter200M ? '$200M' : '$1M'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {largeOrders.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            {filteredOrders.length}/{largeOrders.length} ordens • Valor {'>'} {filter200M ? '$200M' : '$1M'} USD
          </div>
        </div>
      )}
    </div>
  );
};
