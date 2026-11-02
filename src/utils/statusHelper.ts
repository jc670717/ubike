import { YouBikeStation, StationStatusInfo } from '../types';

export function getStationStatus(station: YouBikeStation): StationStatusInfo {
  const isOperational = String(station.act) === '1' || Number(station.act) === 1;
  const rentBikes = Number(station.available_rent_bikes) || 0;

  // 狀態規則：
  // 1. act 不等於 1：停止營運
  if (!isOperational) {
    return {
      type: 'SUSPENDED',
      label: '停止營運',
      badgeClass: 'bg-secondary text-white',
      textColor: 'text-secondary',
      bgLightClass: 'bg-secondary-subtle',
    };
  }

  // 2. available_rent_bikes 等於 0：無車
  if (rentBikes === 0) {
    return {
      type: 'NO_BIKES',
      label: '無車可借',
      badgeClass: 'bg-danger text-white',
      textColor: 'text-danger',
      bgLightClass: 'bg-danger-subtle',
    };
  }

  // 3. available_rent_bikes 小於 5：車輛偏少
  if (rentBikes < 5) {
    return {
      type: 'LOW_BIKES',
      label: '車輛偏少',
      badgeClass: 'bg-warning text-dark',
      textColor: 'text-warning-emphasis',
      bgLightClass: 'bg-warning-subtle',
    };
  }

  // 4. 其他：車輛充足
  return {
    type: 'NORMAL',
    label: '車輛充足',
    badgeClass: 'bg-success text-white',
    textColor: 'text-success',
    bgLightClass: 'bg-success-subtle',
  };
}

export function cleanStationName(name: string): string {
  if (!name) return '';
  return name.replace(/^YouBike2\.0_/, '');
}

export function formatTime(timeStr?: string): string {
  if (!timeStr) return '即時';
  // Formats strings like 2026-08-23 17:15:20 or 20260823171520
  if (timeStr.length === 14 && !timeStr.includes('-') && !timeStr.includes(':')) {
    const y = timeStr.slice(0, 4);
    const m = timeStr.slice(4, 6);
    const d = timeStr.slice(6, 8);
    const h = timeStr.slice(8, 10);
    const min = timeStr.slice(10, 12);
    const s = timeStr.slice(12, 14);
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  }
  return timeStr;
}

export function getGoogleMapUrl(station: YouBikeStation): string {
  if (station.latitude && station.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`;
  }
  const query = encodeURIComponent(`臺北市 ${station.sarea} ${cleanStationName(station.sna)}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
