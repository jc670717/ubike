export interface YouBikeStation {
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

export type StationStatusType = 'SUSPENDED' | 'NO_BIKES' | 'LOW_BIKES' | 'NORMAL';

export interface StationStatusInfo {
  type: StationStatusType;
  label: string;
  badgeClass: string;
  textColor: string;
  bgLightClass: string;
}

export interface SearchQueryParams {
  district: string;
  keyword: string;
  minimumAvailableBikes: number;
  limit: number;
}

export interface GeminiParseResponse {
  success: boolean;
  params?: {
    district: string;
    keyword: string;
    minimumAvailableBikes: number;
    limit: number;
  };
  explanation?: string;
  error?: string;
  source?: 'gemini' | 'fallback';
}

export interface StationsApiResponse {
  success: boolean;
  stations: YouBikeStation[];
  totalAvailableInSource: number;
  filteredCount: number;
  dataUpdateTime: string;
  error?: string;
}
