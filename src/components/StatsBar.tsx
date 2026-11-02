import React from 'react';
import { Bike, ParkingCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { YouBikeStation } from '../types';

interface StatsBarProps {
  stations: YouBikeStation[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ stations }) => {
  const totalStations = stations.length;
  const totalBikes = stations.reduce((sum, s) => sum + (Number(s.available_rent_bikes) || 0), 0);
  const totalEmptySpaces = stations.reduce((sum, s) => sum + (Number(s.available_return_bikes) || 0), 0);

  const adequateStations = stations.filter(
    (s) => (String(s.act) === '1' || Number(s.act) === 1) && Number(s.available_rent_bikes) >= 5
  ).length;

  const adequatePercent = totalStations > 0 ? Math.round((adequateStations / totalStations) * 100) : 0;

  return (
    <div className="row g-3 mb-4">
      <div className="col-6 col-md-3">
        <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
          <div className="card-body p-3 d-flex align-items-center gap-3">
            <div className="p-2 rounded-3 bg-primary-subtle text-primary">
              <Bike size={24} />
            </div>
            <div>
              <div className="text-muted small">可借總車輛</div>
              <div className="fs-5 fw-bold text-dark">{totalBikes.toLocaleString()} 輛</div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-6 col-md-3">
        <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
          <div className="card-body p-3 d-flex align-items-center gap-3">
            <div className="p-2 rounded-3 bg-info-subtle text-info-emphasis">
              <ParkingCircle size={24} />
            </div>
            <div>
              <div className="text-muted small">可還總空位</div>
              <div className="fs-5 fw-bold text-dark">{totalEmptySpaces.toLocaleString()} 位</div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-6 col-md-3">
        <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
          <div className="card-body p-3 d-flex align-items-center gap-3">
            <div className="p-2 rounded-3 bg-success-subtle text-success">
              <CheckCircle size={24} />
            </div>
            <div>
              <div className="text-muted small">車輛充足站點 (≥5)</div>
              <div className="fs-5 fw-bold text-dark">
                {adequateStations} 站 <span className="small text-muted fw-normal">({adequatePercent}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-6 col-md-3">
        <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
          <div className="card-body p-3 d-flex align-items-center gap-3">
            <div className="p-2 rounded-3 bg-warning-subtle text-warning-emphasis">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="text-muted small">目前顯示站點</div>
              <div className="fs-5 fw-bold text-dark">{totalStations} 個站點</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
