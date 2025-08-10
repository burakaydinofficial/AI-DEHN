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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/documents" className="text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{doc.originalName || doc.filename}</h1>
              <p className="text-sm text-gray-500 font-mono">ID: {doc.id}</p>
              <p className="text-xs text-gray-400">Uploaded {new Date(doc.uploadedAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span
              className={clsx(
                'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                {
                  'bg-blue-100 text-blue-800': doc.status === 'uploaded',
                  'bg-green-100 text-green-800': doc.status === 'processed' || doc.status === 'published',
                  'bg-yellow-100 text-yellow-800': doc.status === 'processing',
                  'bg-red-100 text-red-800': doc.status === 'failed',
                  'bg-purple-100 text-purple-800': doc.status === 'reduced',
                  'bg-cyan-100 text-cyan-800': doc.status === 'chunked' || doc.status === 'translated'
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
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Processing Pipeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              Processing Pipeline
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <button
                onClick={triggerReduce}
                disabled={!doc.storage?.analysisKey || processing === 'reduce'}
                className={clsx(
                  'flex items-center justify-center px-4 py-3 border rounded-lg text-sm font-medium transition-all duration-200',
                  processing === 'reduce'
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : !doc.storage?.analysisKey
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300'
                )}
              >
                {processing === 'reduce' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                {processing === 'reduce' ? 'Processing...' : 'Create Reduced JSON'}
              </button>

              <button
                onClick={triggerChunks}
                disabled={(!doc.storage?.reducedKey && !doc.storage?.analysisKey) || processing === 'chunks'}
                className={clsx(
                  'flex items-center justify-center px-4 py-3 border rounded-lg text-sm font-medium transition-all duration-200',
                  processing === 'chunks'
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : (!doc.storage?.reducedKey && !doc.storage?.analysisKey)
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300'
                )}
              >
                {processing === 'chunks' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Grid className="w-4 h-4 mr-2" />
                )}
                {processing === 'chunks' ? 'Processing...' : 'Generate Chunks'}
              </button>

              <div className="flex flex-col space-y-2">
                <div className="text-xs font-medium text-gray-700 mb-1">Translations</div>
                <div className="grid grid-cols-3 gap-1">
                  {['de', 'fr', 'es'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => triggerTranslate(lang)}
                      disabled={!canGenerate || processing === `translate-${lang}`}
                      className={clsx(
                        'flex items-center justify-center px-2 py-2 border rounded text-xs font-medium transition-all duration-200',
                        processing === `translate-${lang}`
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : !canGenerate
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300'
                      )}
                    >
                      {processing === `translate-${lang}` ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        lang.toUpperCase()
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Overview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Processing Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center">
                  <CheckCircle className={clsx('w-4 h-4 mr-2', doc.storage?.analysisJson ? 'text-green-500' : 'text-gray-300')} />
                  <span className={doc.storage?.analysisJson ? 'text-green-700' : 'text-gray-500'}>
                    Analysis {doc.storage?.analysisJson ? 'Ready' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className={clsx('w-4 h-4 mr-2', doc.storage?.reducedJson ? 'text-green-500' : 'text-gray-300')} />
                  <span className={doc.storage?.reducedJson ? 'text-green-700' : 'text-gray-500'}>
                    Reduced {doc.storage?.reducedJson ? 'Ready' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className={clsx('w-4 h-4 mr-2', doc.storage?.chunksJson ? 'text-green-500' : 'text-gray-300')} />
                  <span className={doc.storage?.chunksJson ? 'text-green-700' : 'text-gray-500'}>
                    Chunks {doc.storage?.chunksJson ? 'Ready' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Upload className={clsx('w-4 h-4 mr-2', doc.storage?.imagesPrefix ? 'text-blue-500' : 'text-gray-300')} />
                  <span className={doc.storage?.imagesPrefix ? 'text-blue-700' : 'text-gray-500'}>
                    Images {doc.storage?.imagesPrefix ? 'Uploaded' : 'None'}
                  </span>
                </div>
              </div>
              
              {/* Additional Info */}
              {(doc.availableLanguages?.length || doc.contentReduction) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {doc.availableLanguages && doc.availableLanguages.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Languages className="w-4 h-4 mr-2" />
                      Languages detected: {doc.availableLanguages.join(', ')}
                    </div>
                  )}
                  {doc.contentReduction && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {doc.contentReduction.totalGroups} groups processed with {doc.contentReduction.metadata.aiModel}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Translations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Languages className="w-5 h-5 mr-2 text-cyan-600" />
                Translations ({(doc.translations || []).length})
              </h3>
            </div>
            <div className="p-6">
              {(doc.translations || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Languages className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No translations yet</p>
                  <p className="text-xs mt-1">Generate translations using the buttons above</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(doc.translations || []).map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-bold text-cyan-700">{(t.language || 'unknown').toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-gray-900">{t.language || 'Unknown Language'}</span>
                      </div>
                      <button
                        onClick={() => publish(t.language || 'unknown', 'generated')}
                        disabled={processing === `publish-${t.language}-generated`}
                        className={clsx(
                          'inline-flex items-center px-3 py-1.5 border rounded-md text-xs font-medium transition-colors',
                          processing === `publish-${t.language}-generated`
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
                        )}
                      >
                        {processing === `publish-${t.language}-generated` ? (
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Globe className="w-3 h-3 mr-1" />
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
