import React from 'react';
import { Bike, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  lastUpdated: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  totalStations: number;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  isRefreshing,
  onRefresh,
  totalStations,
}) => {
  return (
    <header className="bg-white border-bottom shadow-sm mb-4">
      <div className="container py-3">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-3 bg-warning text-dark p-2"
              style={{ width: '48px', height: '48px' }}
            >
              <Bike size={30} strokeWidth={2.5} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h1 className="h4 mb-0 fw-bold text-dark">臺北市 YouBike 2.0 即時查詢</h1>
                <span className="badge bg-warning text-dark border border-warning-subtle fw-semibold">
                  即時聯網
                </span>
              </div>
              <p className="text-muted small mb-0 mt-1 d-flex align-items-center gap-2">
                <span className="d-inline-flex align-items-center text-success">
                  <span
                    className="spinner-grow spinner-grow-sm me-1 text-success"
                    style={{ width: '8px', height: '8px' }}
                    role="status"
                  ></span>
                  即時 Open Data 連線中
                </span>
                <span>•</span>
                <span>臺北市共 {totalStations.toLocaleString()} 個站點</span>
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap justify-content-start justify-content-md-end">
            <div className="text-md-end text-muted small me-2">
              <div>資料更新時間</div>
              <div className="fw-semibold text-dark">{lastUpdated || '同步中...'}</div>
            </div>
            <button
              id="btn-refresh-data"
              className="btn btn-outline-secondary d-flex align-items-center gap-2 btn-sm px-3 py-2"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="強制重新向 Open Data 擷取最新即時資料"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin-slow' : ''} />
              <span>{isRefreshing ? '更新中...' : '重新整理'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
