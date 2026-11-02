export interface RawStation {
  sno: string;
  sna: string;
  sarea: string;
  mday: string;
  ar: string;
  act: string | number;
  total: number;
  available_rent_bikes: number;
  available_return_bikes: number;
  srcUpdateTime?: string;
  latitude?: number;
  longitude?: number;
}

const OPEN_DATA_URL =
  'https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json';

let cachedStations: RawStation[] = [];
let lastFetchedTime = 0;
const CACHE_TTL_MS = 20 * 1000;

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
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Open Data API 回應錯誤: HTTP ${response.status}`);
    }

    const data = (await response.json()) as RawStation[];
    if (Array.isArray(data) && data.length > 0) {
      cachedStations = data;
      lastFetchedTime = now;
      return cachedStations;
    }
    throw new Error('回傳空資料陣列');
  } catch (error) {
    console.error('抓取 YouBike Open Data 失敗:', error);
    if (cachedStations.length > 0) {
      return cachedStations;
    }
    throw error;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const {
      district = '',
      keyword = '',
      minBikes = '0',
      limit = '50',
      forceRefresh = 'false',
      status = 'all',
    } = req.query || {};

    const refresh = forceRefresh === 'true' || forceRefresh === '1';
    const allStations = await fetchYouBikeOpenData(refresh);

    const parsedMinBikes = Math.max(0, parseInt(minBikes as string, 10) || 0);
    const parsedLimit = Math.max(1, Math.min(200, parseInt(limit as string, 10) || 50));
    const districtFilter = ((district as string) || '').trim();
    const keywordFilter = ((keyword as string) || '').trim().toLowerCase();
    const statusFilter = ((status as string) || '').trim();

    let filtered = allStations.filter((st) => {
      if (districtFilter && districtFilter !== '全部' && districtFilter !== 'all') {
        if (!st.sarea.includes(districtFilter)) {
          return false;
        }
      }

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

      const rentBikes = Number(st.available_rent_bikes) || 0;
      if (rentBikes < parsedMinBikes) {
        return false;
      }

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

    const sampleTime =
      allStations[0]?.srcUpdateTime || allStations[0]?.mday || new Date().toISOString();

    return res.status(200).json({
      success: true,
      stations: filtered,
      totalAvailableInSource: allStations.length,
      filteredCount,
      dataUpdateTime: sampleTime,
    });
  } catch (error: any) {
    console.error('查詢 YouBike 站點時發生錯誤:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '無法取得臺北市 YouBike 即時資料',
      stations: [],
      totalAvailableInSource: 0,
      filteredCount: 0,
      dataUpdateTime: '',
    });
  }
}
