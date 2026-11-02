import React from 'react';
import { ExternalLink, Bike, ParkingSquare, Clock, MapPin } from 'lucide-react';
import { YouBikeStation } from '../types';
import { getStationStatus, cleanStationName, formatTime, getGoogleMapUrl } from '../utils/statusHelper';

interface StationTableProps {
  stations: YouBikeStation[];
}

export const StationTable: React.FC<StationTableProps> = ({ stations }) => {
  return (
    <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr className="text-secondary small">
              <th scope="col" style={{ minWidth: '180px' }}>
                站點名稱
              </th>
              <th scope="col" style={{ minWidth: '100px' }}>
                行政區
              </th>
              <th scope="col" style={{ minWidth: '220px' }}>
                地址
              </th>
              <th scope="col" className="text-center" style={{ minWidth: '100px' }}>
                可借車輛
              </th>
              <th scope="col" className="text-center" style={{ minWidth: '100px' }}>
                可還空位
              </th>
              <th scope="col" className="text-center" style={{ minWidth: '110px' }}>
                營運狀態
              </th>
              <th scope="col" style={{ minWidth: '160px' }}>
                更新時間
              </th>
              <th scope="col" className="text-end" style={{ minWidth: '80px' }}>
                地圖
              </th>
            </tr>
          </thead>
          <tbody>
            {stations.map((station) => {
              const status = getStationStatus(station);
              const cleanedName = cleanStationName(station.sna);
              const mapUrl = getGoogleMapUrl(station);

              return (
                <tr key={station.sno}>
                  {/* 站點名稱 */}
                  <td>
                    <div className="fw-bold text-dark">{cleanedName}</div>
                    <div className="text-muted small">編號：{station.sno}</div>
                  </td>

                  {/* 行政區 */}
                  <td>
                    <span className="badge bg-primary-subtle text-primary">
                      {station.sarea}
                    </span>
                  </td>

                  {/* 地址 */}
                  <td>
                    <span className="small text-muted text-break">{station.ar || '無'}</span>
                  </td>

                  {/* 可借車輛數 */}
                  <td className="text-center">
                    <span className={`fw-bold fs-5 ${status.textColor}`}>
                      {station.available_rent_bikes}
                    </span>
                    <span className="text-muted small ms-1">輛</span>
                  </td>

                  {/* 可還空位數 */}
                  <td className="text-center">
                    <span className="fw-bold fs-5 text-secondary">
                      {station.available_return_bikes}
                    </span>
                    <span className="text-muted small ms-1">位</span>
                  </td>

                  {/* 狀態 */}
                  <td className="text-center">
                    <span className={`badge ${status.badgeClass} rounded-pill px-2 py-1`}>
                      {status.label}
                    </span>
                  </td>

                  {/* 更新時間 */}
                  <td>
                    <span className="small text-muted d-flex align-items-center gap-1">
                      <Clock size={12} />
                      {formatTime(station.srcUpdateTime || station.updateTime || station.mday)}
                    </span>
                  </td>

                  {/* 地圖連結 */}
                  <td className="text-end">
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary py-1 px-2"
                      title="開啟 Google 地圖"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
