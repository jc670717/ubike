import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';

const TAIPEI_DISTRICTS = [
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

function fallbackRuleParser(query: string) {
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

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { query } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: '請提供有效的查詢字串',
    });
  }

  const trimmedQuery = query.trim();
  const ai = getGeminiClient();

  if (!ai) {
    const parsed = fallbackRuleParser(trimmedQuery);
    return res.status(200).json({
      success: true,
      params: parsed,
      explanation: '（使用內建自然語言規則引擎解析）',
      source: 'fallback',
    });
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

      return res.status(200).json({
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
    }

    const fallback = fallbackRuleParser(trimmedQuery);
    return res.status(200).json({
      success: true,
      params: fallback,
      explanation: 'Gemini 未觸發函式，已自動採用備援解析規則。',
      source: 'fallback',
    });
  } catch (err: any) {
    console.error('Gemini 解析失敗，啟動備援解析:', err);
    const fallback = fallbackRuleParser(trimmedQuery);
    return res.status(200).json({
      success: true,
      params: fallback,
      explanation: 'AI 服務連線異常，已切換至備援規則引擎解析。',
      source: 'fallback',
    });
  }
}
