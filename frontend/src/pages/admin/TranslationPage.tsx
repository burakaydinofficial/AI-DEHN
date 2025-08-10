import React, { useState, useEffect } from 'react';
import { 
  Languages, 
  RefreshCw, 
  CheckCircle,
  Play,
  Eye,
  Globe,
  Download
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  status: 'reduced' | 'translated' | 'failed';
  contentReduction?: {
    totalGroups: number;
    languagesDetected: string[];
    processedAt: string;
  };
  translations?: {
    [lang: string]: {
      status: 'pending' | 'completed' | 'failed';
      completedAt?: string;
      textGroupsCount?: number;
    };
  };
}

interface TranslationParams {
  aiModel: string;
  targetLanguages: string[];
  translationStrategy: string;
  qualityLevel: string;
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
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
];

export const TranslationPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState<Set<string>>(new Set());
  const [translationParams, setTranslationParams] = useState<TranslationParams>({
    aiModel: 'gemini-1.5-pro',
    targetLanguages: ['en', 'es', 'fr'],
    translationStrategy: 'contextual',
    qualityLevel: 'balanced'
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/documents`);
      // Only show documents that are ready for translation
      const docs = (response.data.data || []).filter((doc: Document) => 
        doc.status === 'reduced' || doc.status === 'translated'
      );
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTranslation = async (documentId: string) => {
    try {
      setTranslating(prev => new Set(prev).add(documentId));
      
      const response = await axios.post(`${API_BASE}/admin/documents/${documentId}/translate`, {
        targetLanguages: translationParams.targetLanguages,
        aiModel: translationParams.aiModel,
        translationStrategy: translationParams.translationStrategy,
        qualityLevel: translationParams.qualityLevel
      });

      if (response.data.success) {
        await fetchDocuments();
      }
    } catch (error: any) {
      console.error('Translation failed:', error);
      alert(error.response?.data?.message || 'Translation failed');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reduced':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'translated':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTranslationStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Translation Generation
        </h2>
        <p className="text-gray-600 mb-6">
          Generate multilingual translations using AI. Convert text groups into target languages while 
          preserving context, formatting, and technical terminology.
        </p>

        {/* Translation Parameters */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Translation Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Model
                </label>
                <select
                  value={translationParams.aiModel}
                  onChange={(e) => setTranslationParams(prev => ({ ...prev, aiModel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Translation Strategy
                </label>
                <select
                  value={translationParams.translationStrategy}
                  onChange={(e) => setTranslationParams(prev => ({ ...prev, translationStrategy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="contextual">Contextual (Preserve meaning)</option>
                  <option value="literal">Literal (Word-for-word)</option>
                  <option value="creative">Creative (Localized)</option>
                  <option value="technical">Technical (Preserve terminology)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Level
                </label>
                <select
                  value={translationParams.qualityLevel}
                  onChange={(e) => setTranslationParams(prev => ({ ...prev, qualityLevel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fast">Fast (Quick processing)</option>
                  <option value="balanced">Balanced (Good quality/speed)</option>
                  <option value="high">High (Best quality)</option>
                </select>
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Target Languages ({translationParams.targetLanguages.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                <div className="grid grid-cols-1 gap-1">
                  {AVAILABLE_LANGUAGES.map(lang => (
                    <label key={lang.code} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={translationParams.targetLanguages.includes(lang.code)}
                        onChange={() => toggleTargetLanguage(lang.code)}
                        className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mr-2">{lang.flag}</span>
                      <span className="text-sm font-medium">{lang.name}</span>
                      <span className="ml-auto text-xs text-gray-500">{lang.code.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <Languages className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents ready</h3>
            <p className="text-gray-600">Process documents through content reduction first to enable translation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {doc.originalName}
                      </h3>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.status)}`}>
                        {doc.status === 'translated' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Globe className="w-3 h-3" />
                        )}
                        <span className="capitalize">
                          {doc.status === 'reduced' ? 'Ready for Translation' : doc.status}
                        </span>
                      </div>
                    </div>

                    {/* Content Reduction Info */}
                    {doc.contentReduction && (
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="font-medium text-blue-900">{doc.contentReduction.totalGroups}</div>
                          <div className="text-blue-600">Text Groups</div>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <div className="font-medium text-green-900">{doc.contentReduction.languagesDetected.length}</div>
                          <div className="text-green-600">Source Languages</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <div className="font-medium text-purple-900">
                            {Object.keys(doc.translations || {}).length}
                          </div>
                          <div className="text-purple-600">Translations</div>
                        </div>
                      </div>
                    )}

                    {/* Source Languages */}
                    {doc.contentReduction?.languagesDetected && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700 mr-2">Source Languages:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doc.contentReduction.languagesDetected.map(lang => (
                            <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {lang.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Translation Status */}
                    {doc.translations && Object.keys(doc.translations).length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700 mb-2 block">Translation Progress:</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(doc.translations).map(([lang, translation]) => (
                            <div key={lang} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm font-medium">{lang.toUpperCase()}</span>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs ${getTranslationStatusColor(translation.status)}`}>
                                  {translation.status}
                                </span>
                                {translation.status === 'completed' && (
                                  <button
                                    onClick={() => downloadTranslation(doc.id, lang)}
                                    className="p-1 text-blue-600 hover:text-blue-800"
                                    title="Download translation"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {doc.status === 'reduced' && (
                      <button
                        onClick={() => startTranslation(doc.id)}
                        disabled={translating.has(doc.id) || translationParams.targetLanguages.length === 0}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {translating.has(doc.id) ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Translating...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            Start Translation
                          </>
                        )}
                      </button>
                    )}
                    
                    {doc.status === 'translated' && (
                      <button
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        <Eye className="w-3 h-3" />
                        View Translations
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Translation Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Translation Process
        </h3>
        <div className="text-green-800 space-y-2">
          <p><strong>1. Context Analysis:</strong> AI analyzes text groups with surrounding context</p>
          <p><strong>2. Terminology Recognition:</strong> Preserves technical terms and proper nouns</p>
          <p><strong>3. Cultural Adaptation:</strong> Adapts content to target language conventions</p>
          <p><strong>4. Quality Assurance:</strong> Validates translations for consistency and accuracy</p>
          <p><strong>5. Format Preservation:</strong> Maintains original layout and structure information</p>
        </div>
      </div>

      {/* Translation Stats */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Translation Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-blue-900">{documents.filter(d => d.status === 'reduced').length}</div>
            <div className="text-blue-600 text-sm">Ready for Translation</div>
          </div>
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-green-900">{documents.filter(d => d.status === 'translated').length}</div>
            <div className="text-green-600 text-sm">Translated</div>
          </div>
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-purple-900">
              {documents.reduce((acc, d) => acc + Object.keys(d.translations || {}).length, 0)}
            </div>
            <div className="text-purple-600 text-sm">Total Translations</div>
          </div>
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-orange-900">{translationParams.targetLanguages.length}</div>
            <div className="text-orange-600 text-sm">Selected Languages</div>
          </div>
        </div>
      </div>
    </div>
  );
};
