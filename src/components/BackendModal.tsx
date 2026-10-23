import React, { useState, useEffect } from 'react';
import { BackendHealth } from '../types';
import { getApiBase, setApiBase, fetchHealth } from '../services/api';

interface BackendModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: BackendHealth | null;
  onRefreshHealth: () => void;
}

export const BackendModal: React.FC<BackendModalProps> = ({
  isOpen,
  onClose,
  health,
  onRefreshHealth
}) => {
  const [apiBaseUrl, setApiBaseUrlState] = useState(getApiBase());
  const [testingEndpoint, setTestingEndpoint] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    setApiBaseUrlState(getApiBase());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    setApiBase(apiBaseUrl);
    onRefreshHealth();
    setTestResult(`API Base updated to ${apiBaseUrl}`);
  };

  const handleTestHealth = async () => {
    setTestingEndpoint(true);
    setTestResult(null);
    try {
      const data = await fetchHealth();
      setTestResult(
        `Success: Connected to ${data.backend} (${data.service || data.ai_service}). Database: ${
          data.database
        }`
      );
      onRefreshHealth();
    } catch (e: any) {
      setTestResult(`Error: Could not reach ${apiBaseUrl}/health. Details: ${e.message}`);
    } finally {
      setTestingEndpoint(false);
    }
  };

  const handleDownloadCsv = () => {
    window.location.href = `${apiBaseUrl}/export.csv`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg p-5 shadow-2xl border border-outline-variant/30 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-surface-container pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">terminal</span>
            <div>
              <h3 className="font-headline-sm text-base font-bold text-primary">
                Civic Sentra Backend &amp; AI Layer
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Full-Stack Architecture &amp; Python Flask Interop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Live Connectivity Card */}
        <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Architecture State
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface-container text-secondary font-bold">
              {health?.status || 'Online'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/20">
              <span className="text-[10px] text-on-surface-variant block">AI Model Service</span>
              <span className="font-bold text-primary truncate block">
                {health?.ai_service || 'Gemini 2.5 + Ollama Local'}
              </span>
            </div>
            <div className="bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/20">
              <span className="text-[10px] text-on-surface-variant block">SQLite Database</span>
              <span className="font-bold text-emerald-700 truncate block">
                {health?.database || 'Connected (reports.db)'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-on-surface-variant leading-relaxed">
            The frontend communicates via HTTP REST API. It handles live AI vision triage, incident
            clustering, consensus tracking (+1 confirmations), and CSV exports.
          </div>
        </div>

        {/* API Endpoint Configuration */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-primary block">
            API Base URL Target
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrlState(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-primary focus:ring-2 focus:ring-secondary focus:outline-none"
              placeholder="/api or http://localhost:5000/api"
            />
            <button
              onClick={handleSaveUrl}
              className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-secondary active:scale-95 transition-all"
              type="button"
            >
              Save
            </button>
            <button
              onClick={handleTestHealth}
              disabled={testingEndpoint}
              className="px-3 py-2 bg-surface-container-low border border-outline-variant/40 text-primary rounded-lg text-xs font-bold hover:bg-surface-container-high active:scale-95 transition-all flex items-center gap-1"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">network_check</span>
              Test
            </button>
          </div>

          {/* Quick preset buttons */}
          <div className="flex gap-2 pt-0.5">
            <button
              onClick={() => {
                setApiBaseUrlState('/api');
                setApiBase('/api');
                onRefreshHealth();
              }}
              className="px-2 py-1 rounded text-[10px] font-semibold bg-surface-container text-secondary hover:bg-surface-container-high transition-all"
              type="button"
            >
              Reset to Cloud API (/api)
            </button>
            <button
              onClick={() => {
                setApiBaseUrlState('http://localhost:5000/api');
                setApiBase('http://localhost:5000/api');
                onRefreshHealth();
              }}
              className="px-2 py-1 rounded text-[10px] font-semibold bg-surface-container text-primary hover:bg-surface-container-high transition-all"
              type="button"
            >
              Local Python (http://localhost:5000/api)
            </button>
          </div>

          {testResult && (
            <div
              className={`p-2 rounded-lg text-xs font-mono leading-relaxed ${
                testResult.startsWith('Success')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-error-container text-on-error-container border border-error/30'
              }`}
            >
              {testResult}
            </div>
          )}
        </div>

        {/* Local Terminal Run Instructions */}
        <div className="space-y-1.5 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
          <div className="text-xs font-bold text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">laptop</span>
            Running Local Python Backend on your Laptop
          </div>
          <p className="text-[11px] text-on-surface-variant">
            To run the Python backend with Ollama locally:
          </p>
          <pre className="bg-primary text-secondary-fixed p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto leading-relaxed">
{`# 1. Install dependencies
pip install -r requirements.txt

# 2. Pull local vision model
ollama pull qwen2.5vl:3b

# 3. Start Python API (Port 5000)
python app.py`}
          </pre>
        </div>

        {/* Action Row */}
        <div className="flex gap-2 pt-2 border-t border-surface-container">
          <button
            onClick={handleDownloadCsv}
            className="flex-1 py-2.5 px-3 rounded-lg border border-secondary text-secondary hover:bg-surface-container-low text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Download CSV Export
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-lg bg-primary text-white hover:bg-secondary text-xs font-bold transition-all active:scale-95"
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
