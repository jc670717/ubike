import express, { Request, Response, Router } from 'express';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export interface RawStation {
  sno: string;
  sna: string;
  sarea: string;
  mday: string;
  ar: string;
  sareaen?: string;
  snaen?: string;
  aren?: string;
  act: string | number;
  srcUpdateTime?: string;
  updateTime?: string;
  total: number;
  available_rent_bikes: number;
  latitude?: number;
  longitude?: number;
  available_return_bikes: number;
}

export const TAIPEI_DISTRICTS = [
  '中正區',
  '大同區',
  '中山區',
  '松山區',
  '大安區',
  '萬華區',
  '信義區',
  '士林區',
  '北投區',
  '內湖區',
  '南港區',
  '文山區',
];

const OPEN_DATA_URL =
  'https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json';

// In-memory cache for YouBike Open Data
let cachedStations: RawStation[] = [];
let lastFetchedTime = 0;
const CACHE_TTL_MS = 20 * 1000; // 20 seconds TTL

export async function fetchYouBikeOpenData(forceRefresh = false): Promise<RawStation[]> {
  const now = Date.now();
  if (!forceRefresh && cachedStations.length > 0 && now - lastFetchedTime < CACHE_TTL_MS) {
    return cachedStations;
  }

  try {
    const response = await fetch(OPEN_DATA_URL, {
      headers: {
        'User-Agent': 'Taipei-Youbike-Query/1.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`Open Data API 回應錯誤: HTTP ${response.status}`);
    }

    const data = (await response.json()) as RawStation[];
    if (Array.isArray(data) && data.length > 0) {
      cachedStations = data;
      lastFetchedTime = now;
      return cachedStations;
    } else {
      throw new Error('Open Data 回傳空資料陣列');
    }
  } catch (error) {
    console.error('抓取 YouBike Open Data 失敗:', error);
    // If we have previously cached data, return it instead of completely failing
    if (cachedStations.length > 0) {
      return cachedStations;
    }
    throw error;
  }
}

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Function declaration for Gemini Function Calling
const searchYoubikeStationsDeclaration: FunctionDeclaration = {
  name: 'search_youbike_stations',
  description:
    '依據使用者輸入的繁體中文自然語言查詢，提取臺北市 YouBike 2.0 站點的搜尋參數（包含行政區、關鍵字、最低車輛數與結果上限）',
  parameters: {
    type: Type.OBJECT,
    properties: {
      district: {
        type: Type.STRING,
        description:
          '臺北市行政區名稱。可選值包括：中正區、大同區、中山區、松山區、大安區、萬華區、信義區、士林區、北投區、內湖區、南港區、文山區。若使用者未指定或查詢整個臺北市，請填寫空字串 ""。若使用者只寫簡稱（如「大安」、「信義」），請補上「區」。',
      },
      keyword: {
        type: Type.STRING,
        description:
          '站點名稱、地標、路名或地址中的關鍵字（例如：捷運、台大、科技大樓、忠孝、公園、夜市等）。若無特定關鍵字請填寫空字串 ""。',
      },
      minimumAvailableBikes: {
        type: Type.INTEGER,
        description:
          '使用者期望的最低可借車輛數（例如至少5輛車則填5）。若使用者未提及，預設為 0。',
      },
      limit: {
        type: Type.INTEGER,
        description:
          '使用者期望最多顯示的站點數量（例如顯示3個則填3，找5個則填5）。若未指定，預設為 10，合理範圍 1~50。',
      },
    },
    required: ['district', 'keyword', 'minimumAvailableBikes', 'limit'],
  },
};

// Fallback rule-based natural language parser if Gemini API is not configured or fails
export function fallbackRuleParser(query: string) {
  let district = '';
  for (const d of TAIPEI_DISTRICTS) {
    const shortName = d.replace('區', '');
    if (query.includes(d) || query.includes(shortName)) {
      district = d;
      break;
    }
  }

  let minimumAvailableBikes = 0;
  const minMatch = query.match(/(?:至少|最少|要有|大於|超過|低於)?\s*(\d+)\s*(?:輛|台|部|支)?(?:車|腳踏車|自行車)/);
  if (minMatch && minMatch[1]) {
    minimumAvailableBikes = parseInt(minMatch[1], 10);
  }

  let limit = 10;
  const limitMatch = query.match(/(?:顯示|找|列出|要|看)?\s*(\d+)\s*(?:個|筆|處|間|站)/);
  if (limitMatch && limitMatch[1]) {
    limit = parseInt(limitMatch[1], 10);
  }

  // Remove district, numbers and numbers with units from keyword extraction
  let keyword = query;
  if (district) {
    keyword = keyword.replace(district, '').replace(district.replace('區', ''), '');
  }
  keyword = keyword
    .replace(/(?:幫我|請|找|搜尋|查詢|附近|週邊|周圍|站點|youbike|ubike|微笑單車|而且|至少|最少|顯示|個|輛|台|車)+/gi, ' ')
    .replace(/\d+/g, ' ')
    .trim();

  return {
    district,
    keyword: keyword.length > 0 ? keyword.split(/\s+/)[0] || '' : '',
    minimumAvailableBikes: isNaN(minimumAvailableBikes) ? 0 : minimumAvailableBikes,
    limit: isNaN(limit) || limit <= 0 ? 10 : Math.min(limit, 50),
  };
}

const app = express();
app.use(express.json());

// Enable CORS & pre-flight
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

const apiRouter = Router();

// Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get Taipei Districts
apiRouter.get('/youbike/districts', (req: Request, res: Response) => {
  res.json({ success: true, districts: TAIPEI_DISTRICTS });
});

// Alias for convenience: /districts
apiRouter.get('/districts', (req: Request, res: Response) => {
  res.json({ success: true, districts: TAIPEI_DISTRICTS });
});

// Get YouBike Stations with query parameters
const handleGetStations = async (req: Request, res: Response) => {
  try {
    const {
      district = '',
      keyword = '',
      minBikes = '0',
      limit = '50',
      forceRefresh = 'false',
      status = 'all',
    } = req.query;

    const refresh = forceRefresh === 'true' || forceRefresh === '1';
    const allStations = await fetchYouBikeOpenData(refresh);

    const parsedMinBikes = Math.max(0, parseInt(minBikes as string, 10) || 0);
    const parsedLimit = Math.max(1, Math.min(200, parseInt(limit as string, 10) || 50));
    const districtFilter = (district as string).trim();
    const keywordFilter = (keyword as string).trim().toLowerCase();
    const statusFilter = (status as string).trim();

    let filtered = allStations.filter((st) => {
      // District filter
      if (districtFilter && districtFilter !== '全部' && districtFilter !== 'all') {
        if (!st.sarea.includes(districtFilter)) {
          return false;
        }
      }

      // Keyword filter (searches in station name 'sna' and address 'ar')
      if (keywordFilter) {
        const snaLower = (st.sna || '').toLowerCase();
        const arLower = (st.ar || '').toLowerCase();
        const snaClean = snaLower.replace('youbike2.0_', '');
        if (
          !snaLower.includes(keywordFilter) &&
          !arLower.includes(keywordFilter) &&
          !snaClean.includes(keywordFilter)
        ) {
          return false;
        }
      }

      // Minimum available bikes filter
      const rentBikes = Number(st.available_rent_bikes) || 0;
      if (rentBikes < parsedMinBikes) {
        return false;
      }

      // Status filter
      const isOperational = String(st.act) === '1' || Number(st.act) === 1;
      if (statusFilter === 'operational' && !isOperational) {
        return false;
      }
      if (statusFilter === 'has_bikes' && (!isOperational || rentBikes === 0)) {
        return false;
      }
      if (statusFilter === 'adequate' && (!isOperational || rentBikes < 5)) {
        return false;
      }

      return true;
    });

    const filteredCount = filtered.length;
    if (parsedLimit > 0 && filtered.length > parsedLimit) {
      filtered = filtered.slice(0, parsedLimit);
    }

    const sampleTime = allStations[0]?.srcUpdateTime || allStations[0]?.mday || new Date().toISOString();

    res.json({
      success: true,
      stations: filtered,
      totalAvailableInSource: allStations.length,
      filteredCount,
      dataUpdateTime: sampleTime,
    });
  } catch (error: any) {
    console.error('查詢 YouBike 站點時發生錯誤:', error);
    res.status(500).json({
      success: false,
      error: error.message || '無法取得臺北市 YouBike 即時資料',
      stations: [],
      totalAvailableInSource: 0,
      filteredCount: 0,
      dataUpdateTime: '',
    });
  }
};

apiRouter.get('/youbike/stations', handleGetStations);
apiRouter.get('/stations', handleGetStations);

// Gemini Function Calling for Natural Language Search
const handleParseSearch = async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    res.status(400).json({
      success: false,
      error: '請提供有效的查詢字串',
    });
    return;
  }

  const trimmedQuery = query.trim();
  const ai = getGeminiClient();

  if (!ai) {
    // If no API key is set, use the robust rule-based parser
    const parsed = fallbackRuleParser(trimmedQuery);
    res.json({
      success: true,
      params: parsed,
      explanation: '（使用內建自然語言規則引擎解析）',
      source: 'fallback',
    });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `使用者要查詢臺北市 YouBike 2.0 站點，請呼叫 search_youbike_stations 函式提取條件。使用者輸入：「${trimmedQuery}」`,
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          '你是一個專業的臺北市 YouBike 查詢解析助理。你的任務是從使用者的繁體中文查詢中提取行政區 (district)、關鍵字 (keyword)、最低可借車輛數 (minimumAvailableBikes) 以及顯示上限 (limit)。務必使用 search_youbike_stations 函式。',
        tools: [{ functionDeclarations: [searchYoubikeStationsDeclaration] }],
      },
    });

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const args = (call.args || {}) as {
        district?: string;
        keyword?: string;
        minimumAvailableBikes?: number;
        limit?: number;
      };

      const district = (args.district || '').trim();
      const keyword = (args.keyword || '').trim();
      const minimumAvailableBikes =
        typeof args.minimumAvailableBikes === 'number'
          ? Math.max(0, args.minimumAvailableBikes)
          : 0;
      const limit =
        typeof args.limit === 'number' && args.limit > 0 ? Math.min(50, args.limit) : 10;

      res.json({
        success: true,
        params: {
          district,
          keyword,
          minimumAvailableBikes,
          limit,
        },
        explanation: `Gemini Function Calling 成功解析：${
          district ? `行政區「${district}」` : '全區'
        }${keyword ? `、關鍵字「${keyword}」` : ''}${
          minimumAvailableBikes > 0 ? `、最低 ${minimumAvailableBikes} 輛車` : ''
        }、限制 ${limit} 個站點`,
        source: 'gemini',
      });
      return;
    }

    // If no function call was generated, fallback to rule parser
    const fallback = fallbackRuleParser(trimmedQuery);
    res.json({
      success: true,
      params: fallback,
      explanation: 'Gemini 未觸發函式，已自動採用備援解析規則。',
      source: 'fallback',
    });
  } catch (err: any) {
    console.error('Gemini 解析失敗，啟動備援解析:', err);
    const fallback = fallbackRuleParser(trimmedQuery);
    res.json({
      success: true,
      params: fallback,
      explanation: 'AI 服務連線異常，已切換至備援規則引擎解析。',
      source: 'fallback',
    });
  }
};

apiRouter.post('/gemini/parse-search', handleParseSearch);
apiRouter.post('/parse-search', handleParseSearch);

// Mount router on both /api and / to handle different Vercel rewrite paths seamlessly
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
