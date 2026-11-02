import React, { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, Table as TableIcon, AlertCircle, RefreshCw, SearchX, Bike, Filter } from 'lucide-react';
import { YouBikeStation, SearchQueryParams, StationsApiResponse } from './types';
import { Header } from './components/Header';
import { AiSearchBox } from './components/AiSearchBox';
import { FilterControls } from './components/FilterControls';
import { StatsBar } from './components/StatsBar';
import { StationCard } from './components/StationCard';
import { StationTable } from './components/StationTable';
import { TestCasesPanel, TEST_CASES } from './components/TestCasesPanel';

const DEFAULT_PARAMS: SearchQueryParams = {
  district: '',
  keyword: '',
  minimumAvailableBikes: 0,
  limit: 20,
};

const TAIPEI_DISTRICTS_DEFAULT = [
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

export default function App() {
  const [params, setParams] = useState<SearchQueryParams>(DEFAULT_PARAMS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districts, setDistricts] = useState<string[]>(TAIPEI_DISTRICTS_DEFAULT);
  const [stations, setStations] = useState<YouBikeStation[]>([]);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [totalInSource, setTotalInSource] = useState<number>(0);
  const [dataUpdateTime, setDataUpdateTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Fetch districts list on mount
  useEffect(() => {
    fetch('/api/youbike/districts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.districts)) {
          setDistricts(data.districts);
        }
      })
      .catch((err) => {
        console.warn('載入行政區清單失敗，使用預設 12 行政區:', err);
      });
  }, []);

  // Fetch stations according to current search params
  const fetchStations = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const query = new URLSearchParams({
          district: params.district,
          keyword: params.keyword,
          minBikes: String(params.minimumAvailableBikes),
          limit: String(params.limit),
          status: statusFilter,
          forceRefresh: forceRefresh ? 'true' : 'false',
        });

        const res = await fetch(`/api/youbike/stations?${query.toString()}`);
        if (!res.ok) {
          throw new Error(`伺服器錯誤 (HTTP ${res.status})`);
        }

        const data: StationsApiResponse = await res.json();
        if (data.success) {
          setStations(data.stations || []);
          setFilteredCount(data.filteredCount || 0);
          setTotalInSource(data.totalAvailableInSource || 0);
          if (data.dataUpdateTime) {
            setDataUpdateTime(data.dataUpdateTime);
          }
        } else {
          throw new Error(data.error || '無法取得 YouBike 站點資料');
        }
      } catch (err: any) {
        console.error('查詢站點失敗:', err);
        setErrorMessage(err.message || '無法連線至 YouBike 資料伺服器，請檢查網路或稍後重試。');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [params, statusFilter]
  );

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const handleParamChange = (newValues: Partial<SearchQueryParams>) => {
    setParams((prev) => ({
      ...prev,
      ...newValues,
    }));
  };

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setStatusFilter('all');
  };

  const handleApplyAiParams = (newParams: SearchQueryParams) => {
    setParams(newParams);
  };

  const handleSelectTestCase = (tc: (typeof TEST_CASES)[0]) => {
    setParams(tc.params);
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-light pb-5">
      {/* 1. Header with live update time & refresh button */}
      <Header
        lastUpdated={dataUpdateTime}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchStations(true)}
        totalStations={totalInSource}
      />

      <main className="container flex-grow-1">
        {/* 2. Gemini AI Natural Language Search Box */}
        <AiSearchBox
          onApplyParams={handleApplyAiParams}
          currentParams={params}
        />

        {/* 3. 5 Test Cases Panel (Collapsible for easy verification) */}
        <TestCasesPanel onSelectTestCase={handleSelectTestCase} />

        {/* 4. Manual Query Filter Controls */}
        <FilterControls
          params={params}
          districts={districts}
          onChange={handleParamChange}
          onReset={handleReset}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          totalFiltered={filteredCount}
        />

        {/* 5. Metrics & Quick Stats */}
        {!errorMessage && stations.length > 0 && <StatsBar stations={stations} />}

        {/* 6. Results Header with View Mode Switcher */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <h3 className="h6 mb-0 fw-bold text-dark d-flex align-items-center gap-2">
              <Bike size={18} className="text-warning-emphasis" />
              <span>查詢結果清單</span>
            </h3>
            <span className="badge bg-secondary-subtle text-secondary small">
              顯示 {stations.length} / 找到 {filteredCount} 個站點
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small d-none d-sm-inline">檢視模式：</span>
            <div className="btn-group btn-group-sm" role="group" aria-label="檢視切換">
              <button
                type="button"
                className={`btn ${viewMode === 'card' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setViewMode('card')}
                title="卡片檢視"
              >
                <LayoutGrid size={15} className="me-1 inline" />
                <span>卡片</span>
              </button>
              <button
                type="button"
                className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setViewMode('table')}
                title="表格檢視"
              >
                <TableIcon size={15} className="me-1 inline" />
                <span>表格</span>
              </button>
            </div>
          </div>
        </div>

        {/* 7. Loading State */}
        {isLoading && (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">載入中...</span>
            </div>
            <p className="text-muted mt-3 fw-semibold">正在同步臺北市即時 YouBike 資料...</p>
          </div>
        )}

        {/* 8. Error State (載入失敗) */}
        {!isLoading && errorMessage && (
          <div className="card border-0 shadow-sm rounded-3 bg-white p-5 text-center my-4">
            <div className="d-inline-flex p-3 rounded-circle bg-danger-subtle text-danger mx-auto mb-3">
              <AlertCircle size={40} />
            </div>
            <h4 className="h5 fw-bold text-dark mb-2">資料載入失敗</h4>
            <p className="text-muted mx-auto" style={{ maxWidth: '500px' }}>
              {errorMessage}
            </p>
            <div className="mt-3">
              <button
                type="button"
                className="btn btn-warning px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 text-dark"
                onClick={() => fetchStations(true)}
              >
                <RefreshCw size={16} />
                <span>重新載入</span>
              </button>
            </div>
          </div>
        )}

        {/* 9. Empty State (查無資料) */}
        {!isLoading && !errorMessage && stations.length === 0 && (
          <div className="card border-0 shadow-sm rounded-3 bg-white p-5 text-center my-4">
            <div className="d-inline-flex p-3 rounded-circle bg-warning-subtle text-warning-emphasis mx-auto mb-3">
              <SearchX size={40} />
            </div>
            <h4 className="h5 fw-bold text-dark mb-2">查無符合條件的 YouBike 站點</h4>
            <p className="text-muted mx-auto mb-3" style={{ maxWidth: '500px' }}>
              目前篩選條件過於嚴苛，或所選行政區/關鍵字無符合之站點。建議降低最低車輛限制或擴大搜尋範圍。
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary px-4 py-2"
                onClick={handleReset}
              >
                重設所有條件
              </button>
            </div>
          </div>
        )}

        {/* 10. Data Render (Card View or Table View) */}
        {!isLoading && !errorMessage && stations.length > 0 && (
          <>
            {viewMode === 'card' ? (
              <div className="row g-3">
                {stations.map((station) => (
                  <div key={station.sno} className="col-12 col-md-6 col-lg-4 col-xl-3">
                    <StationCard station={station} />
                  </div>
                ))}
              </div>
            ) : (
              <StationTable stations={stations} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-5 py-4 border-top bg-white text-center text-muted small">
        <div className="container">
          <p className="mb-1">
            資料來源：臺北市政府交通局 Open Data (YouBike 2.0 即時資訊) • 每 20 秒自動快取同步
          </p>
          <p className="mb-0 text-secondary">
            本系統全端架構採用 React + Node.js Express + Bootstrap 5 + Gemini 3.7 Flash AI Function Calling
          </p>
        </div>
      </footer>
    </div>
  );
}
