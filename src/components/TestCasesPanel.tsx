import React, { useState } from 'react';
import { ClipboardList, Play, CheckCircle2, ChevronDown, ChevronUp, Beaker } from 'lucide-react';
import { SearchQueryParams } from '../types';

interface TestCase {
  id: number;
  title: string;
  category: string;
  nlPrompt: string;
  params: SearchQueryParams;
  description: string;
  expectedResult: string;
}

export const TEST_CASES: TestCase[] = [
  {
    id: 1,
    title: '官方指定範例（大安區捷運熱點）',
    category: '自然語言 & 基本條件',
    nlPrompt: '幫我找大安區捷運附近，而且至少有5輛車的站點，顯示3個。',
    params: {
      district: '大安區',
      keyword: '捷運',
      minimumAvailableBikes: 5,
      limit: 3,
    },
    description: '測試 Gemini 能否正確從繁體中文語句提取行政區、捷運關鍵字、5輛車與3筆限制。',
    expectedResult: '正確篩選出大安區捷運站周遭站點，最多顯示 3 筆，每站可借車輛數均 ≥ 5。',
  },
  {
    id: 2,
    title: '信義商圈高乘載熱點篩選',
    category: '商圈熱點',
    nlPrompt: '信義區台北101或市府週邊至少有8輛車的站點，找5筆',
    params: {
      district: '信義區',
      keyword: '101',
      minimumAvailableBikes: 8,
      limit: 5,
    },
    description: '測試信義區商圈熱點站點，並篩選車況充裕（至少8輛）的站點。',
    expectedResult: '列出信義區 101 周圍車輛充足之站點，最多 5 筆，驗證狀態標籤為「車輛充足」。',
  },
  {
    id: 3,
    title: '查無資料邊界測試 (Empty State)',
    category: '異常與邊界防護',
    nlPrompt: '文山區尋找太空站站點，至少500輛車',
    params: {
      district: '文山區',
      keyword: '太空站',
      minimumAvailableBikes: 500,
      limit: 10,
    },
    description: '測試當條件過於嚴苛或關鍵字不存在時系統的空狀態處理。',
    expectedResult: '系統不發生錯誤，顯示友善的「查無符合條件站點」空狀態提示與重設按鈕。',
  },
  {
    id: 4,
    title: '全區跨區學區查詢（台大周邊）',
    category: '跨區學區搜尋',
    nlPrompt: '全臺北台大附近至少10台車，列出5個',
    params: {
      district: '',
      keyword: '台大',
      minimumAvailableBikes: 10,
      limit: 5,
    },
    description: '測試不限行政區（臺北全區）搜尋特定校園/地標，並要求高可借車輛數。',
    expectedResult: '列出橫跨大安/中正等區的台大相關站點，最多 5 筆，且車輛數皆 ≥ 10。',
  },
  {
    id: 5,
    title: '車況狀態規則多樣性檢驗',
    category: '狀態規則驗證',
    nlPrompt: '士林區所有站點，顯示20筆',
    params: {
      district: '士林區',
      keyword: '',
      minimumAvailableBikes: 0,
      limit: 20,
    },
    description: '測試最低車輛設為 0 時，能否完整驗證「無車 (0輛)」、「車輛偏少 (<5輛)」、「車輛充足 (≥5輛)」等狀態規則。',
    expectedResult: '站點卡片依可借車輛數分別套用綠色（充足）、黃色（偏少）、紅色（無車）及灰色（停用）徽章。',
  },
];

interface TestCasesPanelProps {
  onSelectTestCase: (testCase: TestCase) => void;
}

export const TestCasesPanel: React.FC<TestCasesPanelProps> = ({ onSelectTestCase }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card border-0 shadow-sm rounded-3 mb-4 overflow-hidden bg-white">
      <div
        className="card-header bg-light border-0 py-3 px-4 d-flex align-items-center justify-content-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer' }}
      >
        <div className="d-flex align-items-center gap-2">
          <div className="p-1 rounded-circle bg-primary text-white d-flex align-items-center justify-content-center">
            <Beaker size={16} />
          </div>
          <span className="fw-bold text-dark">5 個人工測試案例驗證面板</span>
          <span className="badge bg-primary-subtle text-primary rounded-pill px-2">
            一鍵自動帶入測試
          </span>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-link text-secondary text-decoration-none p-0 d-flex align-items-center gap-1"
        >
          <span>{isOpen ? '收合案例' : '展開檢視 5 大測試案例'}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isOpen && (
        <div className="card-body p-4 border-top">
          <p className="text-muted small mb-3">
            以下為系統預置的 5 個核心人工測試案例，涵蓋自然語言提取、商圈熱點、查無資料防護、全區跨區查詢及車輛狀態規則驗證。點擊「帶入測試」即可立即套用。
          </p>

          <div className="row g-3">
            {TEST_CASES.map((tc) => (
              <div key={tc.id} className="col-12 col-lg-6">
                <div className="card h-100 border rounded-3 p-3 bg-light-subtle">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-dark text-white font-monospace">案例 {tc.id}</span>
                    <span className="badge bg-secondary-subtle text-secondary small">
                      {tc.category}
                    </span>
                  </div>

                  <h4 className="h6 fw-bold text-dark mb-2">{tc.title}</h4>

                  <div className="bg-white p-2 rounded border mb-2 small font-monospace text-primary text-break">
                    💬 「{tc.nlPrompt}」
                  </div>

                  <p className="text-muted small mb-2">{tc.description}</p>

                  <div className="d-flex align-items-center justify-content-between mt-auto pt-2 border-top">
                    <span className="text-success small fw-semibold d-flex align-items-center gap-1">
                      <CheckCircle2 size={14} />
                      預期正確提取
                    </span>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 py-1 px-2"
                      onClick={() => onSelectTestCase(tc)}
                    >
                      <Play size={13} fill="currentColor" />
                      <span>帶入測試</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
