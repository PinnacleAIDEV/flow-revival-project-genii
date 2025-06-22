
interface CoinGeckoResponse {
  [key: string]: {
    usd_market_cap?: number;
  };
}

interface MarketCapData {
  marketCap: number;
  category: 'high' | 'mid' | 'low';
  lastUpdated: number;
}

class MarketCapService {
  private cache = new Map<string, MarketCapData>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutos
  private readonly API_DELAY = 1000; // 1 segundo entre requests
  private lastApiCall = 0;

  // Mapeamento de símbolos para IDs do CoinGecko
  private readonly symbolToId: { [key: string]: string } = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'SOL': 'solana',
    'DOGE': 'dogecoin',
    'DOT': 'polkadot',
    'LINK': 'chainlink',
    'MATIC': 'matic-network',
    'AVAX': 'avalanche-2',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'XLM': 'stellar',
    'VET': 'vechain',
    'FIL': 'filecoin',
    'ETC': 'ethereum-classic',
    'MANA': 'decentraland',
    'SAND': 'the-sandbox',
    'AXS': 'axie-infinity',
    'APE': 'apecoin',
    'CHZ': 'chiliz',
    'GALA': 'gala',
    'ENJ': 'enjincoin',
    'FLOW': 'flow',
    'ICP': 'internet-computer',
    'THETA': 'theta-token',
    'XTZ': 'tezos',
    'MKR': 'maker',
    'FTM': 'fantom',
    'AAVE': 'aave',
    'SNX': 'havven',
    'CRV': 'curve-dao-token',
    'COMP': 'compound-governance-token',
    'SUSHI': 'sushi',
    'YFI': 'yearn-finance',
    'ZRX': '0x',
    'BAT': 'basic-attention-token',
    'KNC': 'kyber-network-crystal',
    'LRC': 'loopring',
    'ZEN': 'zencash',
    'RUNE': 'thorchain',
    'OCEAN': 'ocean-protocol',
    'KAVA': 'kava',
    'IOTA': 'iota',
    'ONT': 'ontology',
    'ZIL': 'zilliqa',
    'QTM': 'qtum',
    'WAVES': 'waves',
    'ICX': 'icon',
    'SC': 'siacoin',
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'LDO': 'lido-dao',
    'RPL': 'rocket-pool',
    'GMX': 'gmx',
    'PEPE': 'pepe',
    'INJ': 'injective-protocol',
    'SUI': 'sui',
    'APT': 'aptos',
    'STX': 'blockstack',
    'MINA': 'mina-protocol',
    'CFX': 'conflux-token',
    'KAS': 'kaspa',
    'TON': 'the-open-network',
    'HBAR': 'hedera-hashgraph',
    'RENDER': 'render-token',
    'IMX': 'immutable-x',
    'FET': 'fetch-ai',
    'GRT': 'the-graph',
    'ROSE': 'oasis-network',
    'DYDX': 'dydx',
    'ENS': 'ethereum-name-service',
    '1INCH': '1inch',
    'PERP': 'perpetual-protocol',
    'MASK': 'mask-network',
    'CTSI': 'cartesi'
  };

  private getSymbolFromTicker(ticker: string): string {
    return ticker.replace('USDT', '').replace('USDC', '').replace('BUSD', '');
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchMarketCap(symbol: string): Promise<number | null> {
    try {
      const now = Date.now();
      if (now - this.lastApiCall < this.API_DELAY) {
        await this.delay(this.API_DELAY - (now - this.lastApiCall));
      }

      const coinId = this.symbolToId[symbol];
      if (!coinId) {
        console.warn(`Market cap ID não encontrado para ${symbol}`);
        return null;
      }

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      this.lastApiCall = Date.now();

      if (!response.ok) {
        console.warn(`Erro na API CoinGecko: ${response.status}`);
        return null;
      }

      const data: CoinGeckoResponse = await response.json();
      const marketCap = data[coinId]?.usd_market_cap;

      if (typeof marketCap === 'number') {
        console.log(`✅ Market cap obtido para ${symbol}: $${(marketCap / 1e9).toFixed(2)}B`);
        return marketCap;
      }

      return null;
    } catch (error) {
      console.warn(`Erro ao buscar market cap para ${symbol}:`, error);
      return null;
    }
  }

  private categorizeMarketCap(marketCap: number): 'high' | 'mid' | 'low' {
    if (marketCap >= 10e9) return 'high';    // >= $10B
    if (marketCap >= 1e9) return 'mid';      // $1B - $10B
    return 'low';                            // < $1B
  }

  async getMarketCapCategory(ticker: string): Promise<'high' | 'mid' | 'low'> {
    const symbol = this.getSymbolFromTicker(ticker);
    const cached = this.cache.get(symbol);
    const now = Date.now();

    // Usar cache se ainda válido
    if (cached && (now - cached.lastUpdated) < this.CACHE_DURATION) {
      return cached.category;
    }

    // Buscar novo market cap
    const marketCap = await this.fetchMarketCap(symbol);
    
    if (marketCap !== null) {
      const category = this.categorizeMarketCap(marketCap);
      this.cache.set(symbol, {
        marketCap,
        category,
        lastUpdated: now
      });
      return category;
    }

    // Fallback: usar cache expirado se disponível, senão usar lista estática
    if (cached) {
      console.log(`📦 Usando cache expirado para ${symbol}: ${cached.category}`);
      return cached.category;
    }

    // Fallback para classificação estática baseada em conhecimento comum
    return this.getStaticMarketCapCategory(symbol);
  }

  private getStaticMarketCapCategory(symbol: string): 'high' | 'mid' | 'low' {
    const highCapSymbols = new Set([
      'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'DOT', 'LINK', 'MATIC', 'AVAX', 'LTC', 'BCH'
    ]);

    const midCapSymbols = new Set([
      'UNI', 'ATOM', 'XLM', 'VET', 'FIL', 'ETC', 'MANA', 'SAND', 'AXS', 'APE', 'CHZ', 'GALA', 
      'ENJ', 'FLOW', 'ICP', 'THETA', 'XTZ', 'MKR', 'FTM', 'AAVE', 'SNX', 'CRV', 'COMP',
      'ARB', 'OP', 'LDO', 'INJ', 'SUI', 'APT', 'STX', 'MINA', 'TON', 'HBAR', 'RENDER', 'IMX', 'FET', 'GRT'
    ]);

    if (highCapSymbols.has(symbol)) return 'high';
    if (midCapSymbols.has(symbol)) return 'mid';
    return 'low';
  }

  // Método para obter informações detalhadas (para debug)
  async getMarketCapInfo(ticker: string): Promise<{ category: 'high' | 'mid' | 'low', marketCap?: number }> {
    const symbol = this.getSymbolFromTicker(ticker);
    const cached = this.cache.get(symbol);
    
    if (cached && (Date.now() - cached.lastUpdated) < this.CACHE_DURATION) {
      return { category: cached.category, marketCap: cached.marketCap };
    }

    const category = await this.getMarketCapCategory(ticker);
    const newCached = this.cache.get(symbol);
    
    return { 
      category, 
      marketCap: newCached?.marketCap 
    };
  }

  // Limpar cache periodicamente
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [symbol, data] of this.cache.entries()) {
      if (now - data.lastUpdated > this.CACHE_DURATION) {
        this.cache.delete(symbol);
      }
    }
  }
}

export const marketCapService = new MarketCapService();

// Limpar cache a cada 1 hora
setInterval(() => {
  marketCapService.clearExpiredCache();
}, 60 * 60 * 1000);
