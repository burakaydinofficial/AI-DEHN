import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import clsx from 'clsx';
import { 
  FileText, 
  Upload, 
  Settings, 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Languages, 
  ArrowLeft,
  RefreshCw,
  Eye,
  Grid3X3 as Grid
} from 'lucide-react';
import './DocumentDetail.css';
import type { ApiResponse, Document } from '../types/api';

const API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'http://localhost:3001/api';

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const canGenerate = useMemo(() => !!doc && (doc.storage?.analysisKey || doc.storage?.reducedKey || doc.storage?.chunksKey), [doc]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/documents/${id}`);
        const data = res.data as ApiResponse<Document>;
        if (!cancelled) setDoc(data.data || null);
      } catch (err) {
        if (!cancelled) setError((err as Error).message || 'Failed to fetch document');
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    const int = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(int); };
  }, [id]);

  async function triggerReduce() {
    try {
      setProcessing('reduce');
      await axios.post(`${API_BASE}/admin/documents/${id}/reduce`);
      await refresh();
    } catch (err) {
      console.error('Content reduction failed:', err);
    } finally {
      setProcessing(null);
    }
  }

  async function triggerChunks() {
    try {
      setProcessing('chunks');
      await axios.post(`${API_BASE}/admin/documents/${id}/chunks`);
      await refresh();
    } catch (err) {
      console.error('Chunks generation failed:', err);
    } finally {
      setProcessing(null);
    }
  }

  async function triggerTranslate(language: string) {
    try {
      setProcessing(`translate-${language}`);
      await axios.post(`${API_BASE}/admin/documents/${id}/generate-translation`, { targetLanguage: language });
      await refresh();
    } catch (err) {
      console.error('Translation failed:', err);
    } finally {
      setProcessing(null);
    }
  }

  async function publish(language: string, version: string) {
    try {
      setProcessing(`publish-${language}-${version}`);
      await axios.post(`${API_BASE}/admin/documents/${id}/publish`, { language, version });
      await refresh();
    } catch (err) {
      console.error('Publishing failed:', err);
    } finally {
      setProcessing(null);
    }
  }
  async function refresh() {
    try {
      const res = await axios.get(`${API_BASE}/admin/documents/${id}`);
      const data = res.data as ApiResponse<Document>;
      setDoc(data.data || null);
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  }

  if (loading) {
    return (
      <div className="document-detail-loading">
        <div className="document-detail-loading-content">
          <RefreshCw className="document-detail-loading-spinner animate-spin" />
          <p className="document-detail-loading-text">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="document-detail-error">
        <div className="document-detail-error-content">
          <AlertCircle className="document-detail-error-icon" />
          <p className="document-detail-error-text">{error}</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="document-detail-not-found">
        <div className="document-detail-not-found-content">
          <FileText className="document-detail-not-found-icon" />
          <p className="document-detail-not-found-text">Document not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-detail">
      {/* Header */}
      <div className="document-detail-header">
        <div className="document-detail-header-content">
          <div className="flex items-center gap-4">
            <Link to="/documents" className="text-gray-500 hover-text-gray-700 transition-colors">
              <ArrowLeft className="icon-sm" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{doc.originalName || doc.filename}</h1>
              <p className="text-sm text-gray-500 font-mono">ID: {doc.id}</p>
              <p className="text-xs text-gray-400">Uploaded {new Date(doc.uploadedAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={clsx(
                'badge badge-sm',
                {
                  'badge-blue': doc.status === 'uploaded',
                  'badge-green': doc.status === 'processed' || doc.status === 'published',
                  'badge-yellow': doc.status === 'processing',
                  'badge-red': doc.status === 'failed',
                  'badge-purple': doc.status === 'reduced',
                  'badge-cyan': doc.status === 'chunked' || doc.status === 'translated'
                }
              )}
            >
              <div className={clsx('w-1.5 h-1.5 rounded-full mr-2', {
                'bg-blue-400': doc.status === 'uploaded',
                'bg-green-400': doc.status === 'processed' || doc.status === 'published',
                'bg-yellow-400': doc.status === 'processing',
                'bg-red-400': doc.status === 'failed',
                'bg-purple-400': doc.status === 'reduced',
                'bg-cyan-400': doc.status === 'chunked' || doc.status === 'translated'
              })} />
              {doc.status}
            </span>
            <button
              onClick={refresh}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw className="icon-xs mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="document-detail-container">
        {/* Processing Pipeline */}
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="card-title">
              <Settings className="icon-sm mr-2 text-blue-600" />
              Processing Pipeline
            </h2>
          </div>
          <div className="card-body">
            <div className="processing-grid">
              <button
                onClick={triggerReduce}
                disabled={!doc.storage?.analysisKey || processing === 'reduce'}
                className={clsx(
                  'processing-btn',
                  processing === 'reduce'
                    ? 'processing-btn-disabled-loading'
                    : !doc.storage?.analysisKey
                    ? 'processing-btn-disabled'
                    : 'processing-btn-green'
                )}
              >
                {processing === 'reduce' ? (
                  <RefreshCw className="icon-xs mr-2 animate-spin" />
                ) : (
                  <Settings className="icon-xs mr-2" />
                )}
                {processing === 'reduce' ? 'Processing...' : 'Create Reduced JSON'}
              </button>

              <button
                onClick={triggerChunks}
                disabled={(!doc.storage?.reducedKey && !doc.storage?.analysisKey) || processing === 'chunks'}
                className={clsx(
                  'processing-btn',
                  processing === 'chunks'
                    ? 'processing-btn-disabled-loading'
                    : (!doc.storage?.reducedKey && !doc.storage?.analysisKey)
                    ? 'processing-btn-disabled'
                    : 'processing-btn-yellow'
                )}
              >
                {processing === 'chunks' ? (
                  <RefreshCw className="icon-xs mr-2 animate-spin" />
                ) : (
                  <Grid className="icon-xs mr-2" />
                )}
                {processing === 'chunks' ? 'Processing...' : 'Generate Chunks'}
              </button>

              <div className="translation-section">
                <div className="translation-label">Translations</div>
                <div className="translation-grid">
                  {['de', 'fr', 'es'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => triggerTranslate(lang)}
                      disabled={!canGenerate || processing === `translate-${lang}`}
                      className={clsx(
                        'translation-btn',
                        processing === `translate-${lang}`
                          ? 'translation-btn-disabled-loading'
                          : !canGenerate
                          ? 'translation-btn-disabled'
                          : 'translation-btn-cyan'
                      )}
                    >
                      {processing === `translate-${lang}` ? (
                        <RefreshCw className="icon-xs animate-spin" />
                      ) : (
                        lang.toUpperCase()
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Overview */}
            <div className="status-overview">
              <h3 className="status-overview-title">Processing Status</h3>
              <div className="status-grid">
                <div className="status-item">
                  <CheckCircle className={clsx('icon-xs mr-2', doc.storage?.analysisJson ? 'status-icon-ready' : 'status-icon-pending')} />
                  <span className={doc.storage?.analysisJson ? 'status-text-ready' : 'status-text-pending'}>
                    Analysis {doc.storage?.analysisJson ? 'Ready' : 'Pending'}
                  </span>
                </div>
                <div className="status-item">
                  <CheckCircle className={clsx('icon-xs mr-2', doc.storage?.reducedJson ? 'status-icon-ready' : 'status-icon-pending')} />
                  <span className={doc.storage?.reducedJson ? 'status-text-ready' : 'status-text-pending'}>
                    Reduced {doc.storage?.reducedJson ? 'Ready' : 'Pending'}
                  </span>
                </div>
                <div className="status-item">
                  <CheckCircle className={clsx('icon-xs mr-2', doc.storage?.chunksJson ? 'status-icon-ready' : 'status-icon-pending')} />
                  <span className={doc.storage?.chunksJson ? 'status-text-ready' : 'status-text-pending'}>
                    Chunks {doc.storage?.chunksJson ? 'Ready' : 'Pending'}
                  </span>
                </div>
                <div className="status-item">
                  <Upload className={clsx('icon-xs mr-2', doc.storage?.imagesPrefix ? 'text-blue-500' : 'status-icon-pending')} />
                  <span className={doc.storage?.imagesPrefix ? 'text-blue-700' : 'status-text-pending'}>
                    Images {doc.storage?.imagesPrefix ? 'Uploaded' : 'None'}
                  </span>
                </div>
              </div>
              
              {/* Additional Info */}
              {(doc.availableLanguages?.length || doc.contentReduction) && (
                <div className="status-additional-info">
                  {doc.availableLanguages && doc.availableLanguages.length > 0 && (
                    <div className="status-info-item mb-2">
                      <Languages className="icon-xs mr-2" />
                      Languages detected: {doc.availableLanguages.join(', ')}
                    </div>
                  )}
                  {doc.contentReduction && (
                    <div className="status-info-item">
                      <Clock className="icon-xs mr-2" />
                      {doc.contentReduction.totalGroups} groups processed with {doc.contentReduction.metadata.aiModel}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="document-sections-grid">
          {/* Translations */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Languages className="icon-sm mr-2 text-cyan-600" />
                Translations ({(doc.translations || []).length})
              </h3>
            </div>
            <div className="card-body">
              {(doc.translations || []).length === 0 ? (
                <div className="empty-state">
                  <Languages className="empty-state-icon" />
                  <p>No translations yet</p>
                  <p className="empty-state-subtitle">Generate translations using the buttons above</p>
                </div>
              ) : (
                <div className="translation-list">
                  {(doc.translations || []).map((t, idx) => (
                    <div key={idx} className="translation-item">
                      <div className="translation-item-left">
                        <div className="translation-avatar">
                          <span className="translation-avatar-text">{(t.language || 'unknown').toUpperCase()}</span>
                        </div>
                        <span className="translation-language">{t.language || 'Unknown Language'}</span>
                      </div>
                      <button
                        onClick={() => publish(t.language || 'unknown', 'generated')}
                        disabled={processing === `publish-${t.language}-generated`}
                        className={clsx(
                          'btn btn-xs',
                          processing === `publish-${t.language}-generated`
                            ? 'btn-disabled'
                            : 'btn-purple'
                        )}
                      >
                        {processing === `publish-${t.language}-generated` ? (
                          <RefreshCw className="icon-xs mr-1 animate-spin" />
                        ) : (
                          <Globe className="icon-xs mr-1" />
                        )}
                        Publish
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Published */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-green-600" />
                Published ({(doc.published || []).length})
              </h3>
            </div>
            <div className="p-6">
              {(doc.published || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nothing published</p>
                  <p className="text-xs mt-1">Publish translations when ready</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(doc.published || []).map((p, idx) => (
                    <div key={idx} className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="font-medium text-green-900">{p.language} / {p.version}</span>
                        </div>
                        <Eye className="w-4 h-4 text-green-600" />
                      </div>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-green-700 hover:text-green-800 underline break-all"
                      >
                        {p.url}
                      </a>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => publish('original', 'original')}
                  disabled={(!doc.storage?.analysisKey && !doc.storage?.chunksKey) || processing === 'publish-original-original'}
                  className={clsx(
                    'w-full flex items-center justify-center px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-200',
                    processing === 'publish-original-original'
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : (!doc.storage?.analysisKey && !doc.storage?.chunksKey)
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300'
                  )}
                >
                  {processing === 'publish-original-original' ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Publish Original JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
