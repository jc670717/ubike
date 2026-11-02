import React, { useState } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft, Loader2, Check, HelpCircle } from 'lucide-react';
import { SearchQueryParams, GeminiParseResponse } from '../types';

interface AiSearchBoxProps {
  onApplyParams: (params: SearchQueryParams, autoSearch?: boolean) => void;
  currentParams: SearchQueryParams;
}

const SAMPLE_PROMPTS = [
  '幫我找大安區捷運附近，而且至少有5輛車的站點，顯示3個。',
  '信義區台北101或市府週邊至少有8輛車的站點，找5筆',
  '中山區公園附近至少3輛車，顯示4個站點',
  '全臺北台大附近至少10台車',
  '文山區動物園附近至少2輛車',
];

export const AiSearchBox: React.FC<AiSearchBoxProps> = ({ onApplyParams }) => {
  const [naturalInput, setNaturalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parseResult, setParseResult] = useState<GeminiParseResponse | null>(null);
  const [lastQuery, setLastQuery] = useState('');

  const handleAiSearch = async (queryText?: string) => {
    const targetQuery = (queryText !== undefined ? queryText : naturalInput).trim();
    if (!targetQuery) return;

    setIsLoading(true);
    setParseResult(null);
    setLastQuery(targetQuery);

    try {
      const res = await fetch('/api/gemini/parse-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetQuery }),
      });

      const data: GeminiParseResponse = await res.json();
      setParseResult(data);

      if (data.success && data.params) {
        onApplyParams({
          district: data.params.district || '',
          keyword: data.params.keyword || '',
          minimumAvailableBikes: data.params.minimumAvailableBikes ?? 0,
          limit: data.params.limit || 10,
        });
      }
    } catch (err: any) {
      console.error('AI 搜尋解析失敗:', err);
      setParseResult({
        success: false,
        error: '無法連線至 AI 解析服務，請直接使用下方手動篩選條件。',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAiSearch();
    }
  };

  const selectSample = (prompt: string) => {
    setNaturalInput(prompt);
    handleAiSearch(prompt);
  };

  return (
    <div className="card border-0 shadow-sm mb-4 overflow-hidden rounded-3">
      <div
        className="card-header border-0 py-3 px-4 d-flex align-items-center justify-content-between text-dark"
        style={{
          background: 'linear-gradient(90deg, #fff3c4 0%, #fff8e1 100%)',
          borderBottom: '1px solid #ffe082',
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <div className="p-1 rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center">
            <Sparkles size={18} />
          </div>
          <span className="fw-bold fs-6">Gemini AI 智慧自然語言查詢</span>
          <span className="badge bg-dark text-white rounded-pill px-2 py-1 small">
            Function Calling
          </span>
        </div>
        <span className="text-muted small d-none d-md-inline">
          輸入如「大安區捷運至少5輛車」即可自動拆解條件
        </span>
      </div>

      <div className="card-body p-4 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAiSearch();
          }}
          className="mb-3"
        >
          <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden border">
            <span className="input-group-text bg-white border-0 text-muted ps-3">
              <Sparkles size={20} className="text-warning" />
            </span>
            <input
              id="ai-natural-query-input"
              type="text"
              className="form-control border-0 px-2 fs-6"
              placeholder="請輸入自然語言，例如：幫我找大安區捷運附近，而且至少有5輛車的站點，顯示3個。"
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              id="btn-submit-ai-search"
              type="submit"
              className="btn btn-warning px-4 d-flex align-items-center gap-2 fw-bold text-dark border-0"
              disabled={isLoading || !naturalInput.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>AI 解析中...</span>
                </>
              ) : (
                <>
                  <span>智慧搜尋</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sample Prompt Chips */}
        <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
          <span className="text-muted small fw-semibold me-1">快速試用範例：</span>
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill py-1 px-3 text-start small border-light-subtle bg-light text-dark hover:bg-warning-subtle"
              onClick={() => selectSample(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* AI Parse Result Display */}
        {parseResult && (
          <div
            className={`mt-3 p-3 rounded-3 border ${
              parseResult.success ? 'bg-light border-warning-subtle' : 'bg-danger-subtle border-danger-subtle'
            }`}
          >
            {parseResult.success && parseResult.params ? (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2 text-success fw-bold small">
                    <Check size={16} />
                    <span>Gemini search_youbike_stations 函式提取成功</span>
                    {parseResult.source === 'fallback' && (
                      <span className="badge bg-secondary text-white">備援規則引擎</span>
                    )}
                  </div>
                  <span className="text-muted small">查詢內容：「{lastQuery}」</span>
                </div>

                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <span className="badge bg-white text-dark border p-2">
                    <span className="text-muted me-1">行政區 (district):</span>
                    <strong className="text-primary">
                      {parseResult.params.district || '全部行政區'}
                    </strong>
                  </span>

                  <span className="badge bg-white text-dark border p-2">
                    <span className="text-muted me-1">關鍵字 (keyword):</span>
                    <strong className="text-success">
                      {parseResult.params.keyword || '無指定 (全部)'}
                    </strong>
                  </span>

                  <span className="badge bg-white text-dark border p-2">
                    <span className="text-muted me-1">最低可借車輛 (minimumAvailableBikes):</span>
                    <strong className="text-danger">
                      {parseResult.params.minimumAvailableBikes} 輛
                    </strong>
                  </span>

                  <span className="badge bg-white text-dark border p-2">
                    <span className="text-muted me-1">顯示上限 (limit):</span>
                    <strong className="text-dark">
                      {parseResult.params.limit} 個站點
                    </strong>
                  </span>
                </div>

                {parseResult.explanation && (
                  <div className="text-muted small mt-2">
                    <span className="fw-semibold">解析說明：</span> {parseResult.explanation}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-danger small d-flex align-items-center gap-2">
                <HelpCircle size={16} />
                <span>{parseResult.error || '解析時發生錯誤，請直接手動設定下方條件。'}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
