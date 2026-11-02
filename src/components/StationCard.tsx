import React, { useState } from 'react';
import { MapPin, Navigation, Bike, ParkingSquare, Clock, Copy, Check, ExternalLink } from 'lucide-react';
import { YouBikeStation } from '../types';
import { getStationStatus, cleanStationName, formatTime, getGoogleMapUrl } from '../utils/statusHelper';

interface StationCardProps {
  station: YouBikeStation;
}

export const StationCard: React.FC<StationCardProps> = ({ station }) => {
  const [copied, setCopied] = useState(false);
  const status = getStationStatus(station);
  const cleanedName = cleanStationName(station.sna);
  const mapUrl = getGoogleMapUrl(station);

  const rentBikes = Number(station.available_rent_bikes) || 0;
  const returnBikes = Number(station.available_return_bikes) || 0;
  const total = Number(station.total) || rentBikes + returnBikes || 1;
  const bikePercent = Math.min(100, Math.round((rentBikes / total) * 100));

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(station.ar || cleanedName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card station-card border-0 shadow-sm h-100 bg-white overflow-hidden">
      {/* Top status bar accent */}
      <div
        style={{
          height: '4px',
          backgroundColor:
            status.type === 'SUSPENDED'
              ? '#6c757d'
              : status.type === 'NO_BIKES'
              ? '#dc3545'
              : status.type === 'LOW_BIKES'
              ? '#ffc107'
              : '#198754',
        }}
      />

      <div className="card-body p-4 d-flex flex-column justify-content-between">
        <div>
          {/* Header row: District badge & Status badge */}
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="badge bg-primary-subtle text-primary fw-semibold px-2 py-1">
              <MapPin size={13} className="me-1 inline" />
              {station.sarea}
            </span>

            <span className={`badge ${status.badgeClass} rounded-pill px-3 py-1 fw-bold`}>
              {status.label}
            </span>
          </div>

          {/* Station Name */}
          <h3 className="h5 fw-bold text-dark mb-2 d-flex align-items-start justify-content-between gap-2">
            <span>{cleanedName}</span>
            <span className="badge bg-light text-muted border font-monospace small">
              2.0
            </span>
          </h3>

          {/* Address */}
          <div className="d-flex align-items-start gap-1 text-muted small mb-3">
            <span className="text-secondary flex-shrink-0 mt-0.5">
              <Navigation size={14} />
            </span>
            <span className="text-break">{station.ar || '地址未提供'}</span>
          </div>

          {/* Metrics Pill Grid */}
          <div className="row g-2 mb-3">
            {/* 可借車輛數 */}
            <div className="col-6">
              <div className={`bike-counter-pill ${status.bgLightClass} border p-2 text-center`}>
                <div className="d-flex align-items-center justify-content-center gap-1 text-muted small mb-1">
                  <Bike size={16} />
                  <span>可借車輛</span>
                </div>
                <div className={`fs-3 fw-bold ${status.textColor}`}>
                  {rentBikes}
                  <span className="fs-6 fw-normal ms-1 text-muted">輛</span>
                </div>
              </div>
            </div>

            {/* 可還空位數 */}
            <div className="col-6">
              <div className="bike-counter-pill bg-light border p-2 text-center">
                <div className="d-flex align-items-center justify-content-center gap-1 text-muted small mb-1">
                  <ParkingSquare size={16} />
                  <span>可還空位</span>
                </div>
                <div className="fs-3 fw-bold text-secondary">
                  {returnBikes}
                  <span className="fs-6 fw-normal ms-1 text-muted">位</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capacity Progress Bar */}
          <div className="mb-3">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>車輛佔比 (總車柱: {total})</span>
              <span>{bikePercent}%</span>
            </div>
            <div className="progress" style={{ height: '6px' }}>
              <div
                className={`progress-bar ${
                  status.type === 'SUSPENDED'
                    ? 'bg-secondary'
                    : status.type === 'NO_BIKES'
                    ? 'bg-danger'
                    : status.type === 'LOW_BIKES'
                    ? 'bg-warning'
                    : 'bg-success'
                }`}
                role="progressbar"
                style={{ width: `${bikePercent}%` }}
                aria-valuenow={bikePercent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </div>

        {/* Card Footer: Update Time & Action Buttons */}
        <div className="pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="text-muted small d-flex align-items-center gap-1">
            <Clock size={13} />
            <span>更新：{formatTime(station.srcUpdateTime || station.updateTime || station.mday)}</span>
          </div>

          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary py-1 px-2 d-flex align-items-center gap-1"
              onClick={handleCopyAddress}
              title="複製地址"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              <span className="small">{copied ? '已複製' : '地址'}</span>
            </button>

            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary py-1 px-2 d-flex align-items-center gap-1"
              title="在 Google Maps 查看位置與導航"
            >
              <ExternalLink size={14} />
              <span className="small">地圖</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
