
export interface LiquidationBubble {
  id: string;
  asset: string;
  type: 'long' | 'short';
  amount: number;
  price: number;
  marketCap: 'high' | 'low';
  timestamp: Date;
  intensity: number;
  change24h: number;
  volume: number;
  lastUpdateTime: Date;
  totalLiquidated: number;
}

export interface TrendReversal {
  asset: string;
  previousType: 'long' | 'short';
  currentType: 'long' | 'short';
  previousVolume: number;
  currentVolume: number;
  reversalRatio: number;
  timestamp: Date;
  intensity: number;
  price: number;
  marketCap: 'high' | 'low';
}

// Lista expandida de ativos high market cap (Top 100+)
export const highMarketCapAssets = [
  // Top 20 principais
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'TRXUSDT', 
  'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'DOTUSDT', 'SHIBUSDT', 'LTCUSDT', 'BCHUSDT', 
  'UNIUSDT', 'WBTCUSDT', 'NEARUSDT', 'ATOMUSDT', 'XLMUSDT',
  
  // Top 21-50
  'VETUSDT', 'FILUSDT', 'ETCUSDT', 'MANAUSDT', 'SANDUSDT', 'AXSUSDT', 'APEUSDT', 
  'CHZUSDT', 'GALAUSDT', 'ENJUSDT', 'QNTUSDT', 'FLOWUSDT', 'ICPUSDT', 'THETAUSDT', 
  'XTZUSDT', 'MKRUSDT', 'FTMUSDT', 'AAVEUSDT', 'SNXUSDT', 'CRVUSDT', 'COMPUSDT',
  
  // Top 51-80
  'SUSHIUSDT', 'YFIUSDT', 'ZRXUSDT', 'BATUSDT', 'RENUSDT', 'KNCUSDT', 'LRCUSDT', 
  'ALPHAUSDT', 'ZENUSDT', 'RUNEUSDT', 'OCEANUSDT', 'RSRUSDT', 'KAVAUSDT', 'IOTAUSDT',
  'ONTUSDT', 'ZILUSDT', 'QTMUSDT', 'WAVESUSDT', 'ICXUSDT', 'SCUSDT',
  
  // DeFi e L2s importantes
  'ARBUSDT', 'OPUSDT', 'LDOUSDT', 'RPLRUSDT', 'GMXUSDT', 'PEPEUSDT', 'INJUSDT',
  'SUIUSDT', 'APTUSDT', 'STXUSDT', 'MINAUSDT', 'CFXUSDT', 'KASUSDT',
  
  // Adicionais para maior cobertura
  'TONUSDT', 'HBARUSDT', 'RENDERUSDT', 'IMXUSDT', 'FETUSDT', 'GRTUSDT', 'SANDUSDT',
  'ROSEUSDT', 'DYDXUSDT', 'ENSUSDT', '1INCHUSDT', 'PERPUSDT', 'MASKUSDT', 'CTSIUSDT'
];

// Assets considerados low market cap para contraste
export const lowMarketCapAssets = [
  // Memecoins e tokens menores
  'FLOKIUSDT', 'BONKUSDT', 'WIFUSDT', 'MEMEUSDT', 'TURBOUSDT', 'BOMEUSDT',
  '1000RATSUSDT', 'ORDIUSDT', '1000SATSUSDT', 'JUPUSDT', 'WUSDT', 'MYRORUSDT',
  
  // Tokens emergentes e de menor market cap
  'NKNUSDT', 'STORJUSDT', 'RAYUSDT', 'SPELLUSDT', 'JASMYUSDT', 'HIGHUSDT',
  'PORTALUSDT', 'PIXELUSDT', 'STRKUSDT', 'WUSDT', 'ACEUSDT', 'NFPUSDT',
  'AIUSDT', 'XAIUSDT', 'MANTAUSDT', 'ALTUSDT', 'PYTHUSDT', 'RONINUSDT',
  
  // Gaming e NFT tokens menores
  'YGGUSDT', 'ALICEUSDT', 'TLMUSDT', 'DEGOUSDT', 'SUPERUSDT', 'GHSTUSDT',
  'MCUSDT', 'PROSUSDT', 'FTTUSDT', 'LOOMUSDT', 'COMBOUSDT', 'MAVUSDT'
];

export const getMarketCapCategory = (ticker: string): 'high' | 'low' => {
  if (highMarketCapAssets.includes(ticker)) return 'high';
  if (lowMarketCapAssets.includes(ticker)) return 'low';
  
  // Classificação automática baseada no ticker
  // Tokens com nomes muito específicos ou números tendem a ser low cap
  if (ticker.includes('1000') || ticker.length > 8) return 'low';
  
  return 'high'; // Default para high cap se não identificado
};

export interface LiquidationStats {
  totalLong: number;
  totalShort: number;
  highCapLong: number;
  highCapShort: number;
  lowCapLong: number;
  lowCapShort: number;
}

// Configurações para detecção balanceada
export interface DetectionConfig {
  minLiquidationsPerType: number;
  maxLiquidationsPerType: number;
  highCapRatio: number; // Percentual de high cap (0.5 = 50%)
  lowCapRatio: number;  // Percentual de low cap (0.5 = 50%)
}

export const defaultDetectionConfig: DetectionConfig = {
  minLiquidationsPerType: 5,
  maxLiquidationsPerType: 15,
  highCapRatio: 0.5,
  lowCapRatio: 0.5
};
