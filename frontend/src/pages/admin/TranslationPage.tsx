import React, { useState, useEffect } from 'react';
import { 
  Languages, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Play,
  Download,
  Clock,
  Loader
} from 'lucide-react';
import axios from 'axios';
import { DOCUMENT_STATUS, DocumentStatus } from '../../constants/enums';
import './AdminPages.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  status: DocumentStatus;
  processingStage?: string;
  contentReduction?: {
    totalGroups: number;
    languagesDetected: string[];
    processedAt: string;
  };
  translations?: TranslationArtifact[];
  error?: string;
}

interface TranslationArtifact {
  id: string;
  name: string;
  language: string;
  size: number;
  uploadedAt: string;
  version: string;
  metadata?: {
    aiModel?: string;
    translationStrategy?: string;
    qualityLevel?: string;
    processingTime?: number;
    groupCount?: number;
  };
}

interface TranslationParams {
  targetLanguages: string[];
  sourceLanguage?: string;
}

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' }
];

export const TranslationPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState<Set<string>>(new Set());
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [translationParams, setTranslationParams] = useState<TranslationParams>({
    targetLanguages: []
  });

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/admin/documents?status=reduced,translated,translating,processing`);
      const filteredDocs = response.data.data.documents?.filter((doc: Document) => 
        ['reduced', 'translated', 'translating', 'processing'].includes(doc.status)
      ) || [];
      setDocuments(filteredDocs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const startTranslation = async (documentId: string) => {
    if (translationParams.targetLanguages.length === 0) {
      alert('Please select at least one target language');
      return;
    }

    try {
      setTranslating(prev => new Set([...prev, documentId]));
      
      const requestData = {
        ...translationParams,
        documentId
      };

      await axios.post(`${API_BASE}/admin/documents/${documentId}/translate`, requestData);
      
      // Refresh documents to show updated status
      await fetchDocuments();
      
    } catch (error: any) {
      console.error('Translation failed:', error);
      alert(error.response?.data?.error || 'Translation failed');
    } finally {
      setTranslating(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const downloadTranslation = async (documentId: string, language: string) => {
    try {
      const response = await axios.get(`${API_BASE}/admin/documents/${documentId}/translations/${language}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translation_${language}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download translation');
    }
  };

  const toggleTargetLanguage = (langCode: string) => {
    setTranslationParams(prev => ({
      ...prev,
      targetLanguages: prev.targetLanguages.includes(langCode)
        ? prev.targetLanguages.filter(l => l !== langCode)
        : [...prev.targetLanguages, langCode]
    }));
  };

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const startBatchTranslation = async () => {
    if (selectedDocuments.size === 0) {
      alert('Please select at least one document');
      return;
    }
    
    if (translationParams.targetLanguages.length === 0) {
      alert('Please select at least one target language');
      return;
    }

    const documentsArray = Array.from(selectedDocuments);
    for (const docId of documentsArray) {
      await startTranslation(docId);
    }
    
    setSelectedDocuments(new Set());
  };

  const getStatusInfo = (doc: Document) => {
    switch (doc.status) {
      case DOCUMENT_STATUS.REDUCED:
        return { color: 'text-blue-600 bg-blue-100', icon: <Clock className="w-4 h-4" />, text: 'Ready for Translation' };
      case DOCUMENT_STATUS.PROCESSING:
      case DOCUMENT_STATUS.TRANSLATING:
        return { color: 'text-orange-600 bg-orange-100', icon: <Loader className="w-4 h-4 animate-spin" />, text: 'Translating...' };
      case DOCUMENT_STATUS.TRANSLATED:
        return { color: 'text-green-600 bg-green-100', icon: <CheckCircle className="w-4 h-4" />, text: 'Translation Complete' };
      case DOCUMENT_STATUS.FAILED:
        return { color: 'text-red-600 bg-red-100', icon: <AlertCircle className="w-4 h-4" />, text: 'Translation Failed' };
      default:
        return { color: 'text-gray-600 bg-gray-100', icon: <Clock className="w-4 h-4" />, text: 'Unknown Status' };
    }
  };

  const getLanguageName = (code: string): string => {
    const lang = AVAILABLE_LANGUAGES.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code.toUpperCase();
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1><Languages className="w-6 h-6" />Translation Management</h1>
        </div>
        <div className="admin-loading">
          <RefreshCw className="w-8 h-8 animate-spin" />
          Loading documents...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1><Languages className="w-6 h-6" />Translation Management</h1>
          <p className="admin-subtitle">AI-powered multilingual document translation</p>
        </div>
        <div className="admin-header-actions">
          <button 
            className="admin-btn admin-btn-secondary"
            onClick={fetchDocuments}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {selectedDocuments.size > 0 && (
            <button 
              className="admin-btn admin-btn-primary"
              onClick={startBatchTranslation}
            >
              <Play className="w-4 h-4" />
              Translate Selected ({selectedDocuments.size})
            </button>
          )}
        </div>
      </div>

      {/* Translation Configuration Panel */}
      <div className="admin-card mb-6">
        <div className="admin-card-header">
          <h2>Translation Configuration</h2>
          <p className="text-sm text-gray-600">Select target languages for AI-powered translation</p>
        </div>
        <div className="admin-card-content">
          {/* Target Languages */}
          <div className="space-y-3">
            <label className="admin-label">
              Target Languages ({translationParams.targetLanguages.length} selected)
            </label>
            <div className="language-grid">
              {AVAILABLE_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => toggleTargetLanguage(lang.code)}
                  className={`language-option ${
                    translationParams.targetLanguages.includes(lang.code) 
                      ? 'language-option-selected' 
                      : 'language-option-unselected'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Translations use the latest AI model with optimized prompts for maximum quality and accuracy.
            </p>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2>Documents Ready for Translation</h2>
          <span className="admin-stat-badge">{documents.length} documents</span>
        </div>
        
        {documents.length === 0 ? (
          <div className="admin-empty-state">
            <Languages className="w-12 h-12 text-gray-400 mb-4" />
            <h3>No Documents Ready</h3>
            <p>Complete content reduction on documents before translation.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="w-12">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocuments(new Set(documents.map(doc => doc.id)));
                        } else {
                          setSelectedDocuments(new Set());
                        }
                      }}
                      checked={selectedDocuments.size === documents.length && documents.length > 0}
                      className="admin-checkbox"
                    />
                  </th>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Source Languages</th>
                  <th>Available Translations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const statusInfo = getStatusInfo(doc);
                  const isTranslating = translating.has(doc.id);
                  
                  return (
                    <tr key={doc.id} className="admin-table-row">
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedDocuments.has(doc.id)}
                          onChange={() => toggleDocumentSelection(doc.id)}
                          className="admin-checkbox"
                        />
                      </td>
                      <td>
                        <div className="admin-file-info">
                          <span className="admin-filename">{doc.originalName}</span>
                          <span className="admin-file-size">{doc.id}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.text}
                        </span>
                        {doc.error && (
                          <div className="text-xs text-red-600 mt-1">{doc.error}</div>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {doc.contentReduction?.languagesDetected?.map(lang => (
                            <span key={lang} className="admin-language-tag">
                              {getLanguageName(lang)}
                            </span>
                          )) || <span className="text-gray-500">-</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {doc.translations?.length ? (
                            doc.translations.map(translation => (
                              <button
                                key={translation.id}
                                onClick={() => downloadTranslation(doc.id, translation.language)}
                                className="admin-language-tag admin-language-tag-clickable"
                                title="Click to download"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                {getLanguageName(translation.language)}
                              </button>
                            ))
                          ) : (
                            <span className="text-gray-500">None</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-actions">
                          {doc.status === DOCUMENT_STATUS.REDUCED && (
                            <button
                              onClick={() => startTranslation(doc.id)}
                              disabled={isTranslating || translationParams.targetLanguages.length === 0}
                              className="admin-btn admin-btn-sm admin-btn-primary"
                            >
                              {isTranslating ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                              Translate
                            </button>
                          )}
                          {doc.status === DOCUMENT_STATUS.TRANSLATED && (
                            <button
                              onClick={() => startTranslation(doc.id)}
                              disabled={isTranslating}
                              className="admin-btn admin-btn-sm admin-btn-secondary"
                            >
                              {isTranslating ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              Re-translate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
