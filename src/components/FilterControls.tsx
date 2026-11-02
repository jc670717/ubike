import React from 'react';
import { Search, MapPin, SlidersHorizontal, RotateCcw, Filter, Bike, Hash } from 'lucide-react';
import { SearchQueryParams } from '../types';

interface FilterControlsProps {
  params: SearchQueryParams;
  districts: string[];
  onChange: (newParams: Partial<SearchQueryParams>) => void;
  onReset: () => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  totalFiltered: number;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  params,
  districts,
  onChange,
  onReset,
  statusFilter,
  onStatusFilterChange,
  totalFiltered,
}) => {
  return (
    <div className="card border-0 shadow-sm rounded-3 mb-4">
      <div className="card-body p-4">
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <Filter size={18} className="text-warning-emphasis" />
            <h2 className="h6 mb-0 fw-bold text-dark">查詢條件篩選</h2>
          </div>
          <button
            id="btn-reset-filters"
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={onReset}
            title="重設為預設查詢條件"
          >
            <RotateCcw size={14} />
            <span>重設條件</span>
          </button>
        </div>

        {/* Form Inputs Grid */}
        <div className="row g-3">
          {/* 1. 行政區選擇 */}
          <div className="col-12 col-md-6 col-lg-3">
            <label htmlFor="filter-district-select" className="form-label small fw-semibold text-muted d-flex align-items-center gap-1 mb-1">
              <MapPin size={15} className="text-primary" />
              <span>1. 選擇行政區</span>
            </label>
            <select
              id="filter-district-select"
              className="form-select"
              value={params.district}
              onChange={(e) => onChange({ district: e.target.value })}
            >
              <option value="">全部行政區 (臺北市全區)</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* 2. 站名或地址關鍵字 */}
          <div className="col-12 col-md-6 col-lg-4">
            <label htmlFor="filter-keyword-input" className="form-label small fw-semibold text-muted d-flex align-items-center gap-1 mb-1">
              <Search size={15} className="text-success" />
              <span>2. 站名或地址關鍵字</span>
            </label>
            <div className="input-group">
              <input
                id="filter-keyword-input"
                type="text"
                className="form-control"
                placeholder="例如：捷運、台大、公園、忠孝..."
                value={params.keyword}
                onChange={(e) => onChange({ keyword: e.target.value })}
              />
              {params.keyword && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => onChange({ keyword: '' })}
                  title="清除關鍵字"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 3. 最低可借車輛數 */}
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label htmlFor="filter-min-bikes-input" className="form-label small fw-semibold text-muted d-flex align-items-center gap-1 mb-0">
                <Bike size={15} className="text-danger" />
                <span>3. 最低可借車輛</span>
              </label>
              <span className="badge bg-warning-subtle text-warning-emphasis fw-bold">
                ≥ {params.minimumAvailableBikes} 輛
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <input
                id="filter-min-bikes-range"
                type="range"
                className="form-range flex-grow-1"
                min="0"
                max="20"
                step="1"
                value={params.minimumAvailableBikes}
                onChange={(e) => onChange({ minimumAvailableBikes: parseInt(e.target.value, 10) || 0 })}
              />
              <input
                id="filter-min-bikes-input"
                type="number"
                className="form-control form-control-sm text-center"
                style={{ width: '60px' }}
                min="0"
                max="100"
                value={params.minimumAvailableBikes}
                onChange={(e) => onChange({ minimumAvailableBikes: Math.max(0, parseInt(e.target.value, 10) || 0) })}
              />
            </div>
          </div>

          {/* 4. 最多顯示站點數 */}
          <div className="col-12 col-sm-6 col-lg-2">
            <label htmlFor="filter-limit-select" className="form-label small fw-semibold text-muted d-flex align-items-center gap-1 mb-1">
              <Hash size={15} className="text-info" />
              <span>4. 最多顯示筆數</span>
            </label>
            <select
              id="filter-limit-select"
              className="form-select"
              value={params.limit}
              onChange={(e) => onChange({ limit: parseInt(e.target.value, 10) || 10 })}
            >
              <option value={3}>3 筆站點</option>
              <option value={5}>5 筆站點</option>
              <option value={10}>10 筆站點</option>
              <option value={20}>20 筆站點</option>
              <option value={50}>50 筆站點</option>
              <option value={100}>100 筆站點</option>
              <option value={200}>200 筆站點</option>
            </select>
          </div>
        </div>

        {/* Quick District Buttons for Mobile / Fast Tapping */}
        <div className="mt-3 pt-3 border-top">
          <div className="d-flex align-items-center gap-1 flex-wrap">
            <span className="text-muted small fw-semibold me-2">快速行政區：</span>
            <button
              type="button"
              className={`btn btn-sm rounded-pill py-0 px-2 ${
                params.district === '' ? 'btn-dark' : 'btn-outline-secondary'
              }`}
              onClick={() => onChange({ district: '' })}
            >
              全區
            </button>
            {districts.map((d) => (
              <button
                key={d}
                type="button"
                className={`btn btn-sm rounded-pill py-0 px-2 ${
                  params.district === d ? 'btn-primary' : 'btn-outline-secondary'
                }`}
                onClick={() => onChange({ district: d })}
              >
                {d.replace('區', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Sub-Bar */}
        <div className="mt-3 pt-3 border-top d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted small fw-semibold">狀態速篩：</span>
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${statusFilter === 'all' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => onStatusFilterChange('all')}
              >
                全部站點
              </button>
              <button
                type="button"
                className={`btn ${statusFilter === 'operational' ? 'btn-dark' : 'btn-outline-secondary'}`}
                onClick={() => onStatusFilterChange('operational')}
              >
                正常營運中
              </button>
              <button
                type="button"
                className={`btn ${statusFilter === 'has_bikes' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => onStatusFilterChange('has_bikes')}
              >
                僅看有車 (≥1)
              </button>
              <button
                type="button"
                className={`btn ${statusFilter === 'adequate' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => onStatusFilterChange('adequate')}
              >
                車輛充足 (≥5)
              </button>
            </div>
          </div>

          <div className="text-muted small">
            符合條件站點：<strong className="text-dark fs-6">{totalFiltered}</strong> 個
          </div>
        </div>
      </div>
    </div>
  );
};
