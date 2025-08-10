import React, { useState, useEffect } from 'react';
import { 
  Send, 
  RefreshCw, 
  CheckCircle,
  Eye,
  Globe,
  Download,
  Copy,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  status: 'translated' | 'published' | 'failed';
  translations?: {
    [lang: string]: {
      status: 'pending' | 'completed' | 'failed';
      completedAt?: string;
      textGroupsCount?: number;
    };
  };
  publications?: {
    [version: string]: {
      languages: string[];
      publishedAt: string;
      url?: string;
      format: string;
      status: 'active' | 'archived';
    };
  };
}

interface PublishParams {
  selectedLanguages: string[];
  outputFormat: string;
  versionName: string;
  publicAccess: boolean;
  includeMetadata: boolean;
}

const OUTPUT_FORMATS = [
  { value: 'pdf', label: 'PDF Document', description: 'Recreate PDF with translated content' },
  { value: 'json', label: 'JSON Data', description: 'Structured data format' },
  { value: 'html', label: 'HTML Web Page', description: 'Interactive web format' },
  { value: 'xml', label: 'XML Document', description: 'Structured markup format' }
];

export const PublishingPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<Set<string>>(new Set());
  const [publishParams, setPublishParams] = useState<PublishParams>({
    selectedLanguages: [],
    outputFormat: 'pdf',
    versionName: '',
    publicAccess: false,
    includeMetadata: true
  });
  const [selectedDocument, setSelectedDocument] = useState<string>('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/documents`);
      // Only show documents that are ready for publishing
      const docs = (response.data.data || []).filter((doc: Document) => 
        doc.status === 'translated' || doc.status === 'published'
      );
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableLanguages = (doc: Document) => {
    if (!doc.translations) return [];
    return Object.entries(doc.translations)
      .filter(([_, translation]) => translation.status === 'completed')
      .map(([lang]) => lang);
  };

  const startPublishing = async (documentId: string) => {
    if (!publishParams.versionName.trim()) {
      alert('Please enter a version name');
      return;
    }

    if (publishParams.selectedLanguages.length === 0) {
      alert('Please select at least one language');
      return;
    }

    try {
      setPublishing(prev => new Set(prev).add(documentId));
      
      const response = await axios.post(`${API_BASE}/admin/documents/${documentId}/publish`, {
        languages: publishParams.selectedLanguages,
        outputFormat: publishParams.outputFormat,
        versionName: publishParams.versionName,
        publicAccess: publishParams.publicAccess,
        includeMetadata: publishParams.includeMetadata
      });

      if (response.data.success) {
        await fetchDocuments();
        // Reset form
        setPublishParams(prev => ({
          ...prev,
          selectedLanguages: [],
          versionName: ''
        }));
        setSelectedDocument('');
      }
    } catch (error: any) {
      console.error('Publishing failed:', error);
      alert(error.response?.data?.message || 'Publishing failed');
    } finally {
      setPublishing(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const downloadPublication = async (documentId: string, version: string) => {
    try {
      const response = await axios.get(`${API_BASE}/admin/documents/${documentId}/publications/${version}/download`, {
        responseType: 'blob'
      });
      
      const doc = documents.find(d => d.id === documentId);
      const publication = doc?.publications?.[version];
      const extension = publication?.format || 'pdf';
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${doc?.originalName}_${version}.${extension}`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download publication');
    }
  };

  const copyPublicUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert('URL copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy URL:', error);
      alert('Failed to copy URL');
    }
  };

  const toggleLanguageSelection = (langCode: string) => {
    setPublishParams(prev => ({
      ...prev,
      selectedLanguages: prev.selectedLanguages.includes(langCode)
        ? prev.selectedLanguages.filter(l => l !== langCode)
        : [...prev.selectedLanguages, langCode]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'translated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
          Content Publishing
        </h2>
        <p className="text-gray-600 mb-6">
          Publish translated documents in various formats. Generate PDFs, web pages, or structured data 
          with multilingual content ready for distribution.
        </p>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents ready</h3>
            <p className="text-gray-600">Complete translation process first to enable publishing.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Publishing Configuration */}
            {selectedDocument && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-4">Publishing Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Version Name
                      </label>
                      <input
                        type="text"
                        value={publishParams.versionName}
                        onChange={(e) => setPublishParams(prev => ({ ...prev, versionName: e.target.value }))}
                        placeholder="e.g., v1.0, release-2024"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Output Format
                      </label>
                      <select
                        value={publishParams.outputFormat}
                        onChange={(e) => setPublishParams(prev => ({ ...prev, outputFormat: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {OUTPUT_FORMATS.map(format => (
                          <option key={format.value} value={format.value}>
                            {format.label}
                          </option>
                        ))}
                      </select>
                      {OUTPUT_FORMATS.find(f => f.value === publishParams.outputFormat) && (
                        <p className="text-sm text-gray-600 mt-1">
                          {OUTPUT_FORMATS.find(f => f.value === publishParams.outputFormat)?.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={publishParams.publicAccess}
                          onChange={(e) => setPublishParams(prev => ({ ...prev, publicAccess: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Enable public access</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={publishParams.includeMetadata}
                          onChange={(e) => setPublishParams(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Include metadata</span>
                      </label>
                    </div>
                  </div>

                  {/* Right Column - Language Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Languages to Publish ({publishParams.selectedLanguages.length} selected)
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                      {(() => {
                        const doc = documents.find(d => d.id === selectedDocument);
                        const availableLanguages = getAvailableLanguages(doc!);
                        
                        return availableLanguages.map(lang => (
                          <label key={lang} className="flex items-center p-1 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={publishParams.selectedLanguages.includes(lang)}
                              onChange={() => toggleLanguageSelection(lang)}
                              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium">{lang.toUpperCase()}</span>
                          </label>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setSelectedDocument('')}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => startPublishing(selectedDocument)}
                    disabled={publishing.has(selectedDocument)}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {publishing.has(selectedDocument) ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Publish
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Document List */}
            <div className="space-y-4">
              {documents.map((doc) => {
                const availableLanguages = getAvailableLanguages(doc);
                
                return (
                  <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {doc.originalName}
                          </h3>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.status)}`}>
                            {doc.status === 'published' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Globe className="w-3 h-3" />
                            )}
                            <span className="capitalize">
                              {doc.status === 'translated' ? 'Ready to Publish' : doc.status}
                            </span>
                          </div>
                        </div>

                        {/* Available Languages */}
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700 mr-2">Available Languages:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {availableLanguages.map(lang => (
                              <span key={lang} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {lang.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Published Versions */}
                        {doc.publications && Object.keys(doc.publications).length > 0 && (
                          <div className="mb-3">
                            <span className="text-sm font-medium text-gray-700 mb-2 block">Published Versions:</span>
                            <div className="space-y-2">
                              {Object.entries(doc.publications).map(([version, publication]) => (
                                <div key={version} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                                  <div>
                                    <span className="font-medium text-green-900">{version}</span>
                                    <span className="text-green-700 text-sm ml-2">
                                      ({publication.languages.length} languages, {publication.format.toUpperCase()})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => downloadPublication(doc.id, version)}
                                      className="p-1 text-green-600 hover:text-green-800"
                                      title="Download"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    {publication.url && (
                                      <>
                                        <button
                                          onClick={() => copyPublicUrl(publication.url!)}
                                          className="p-1 text-green-600 hover:text-green-800"
                                          title="Copy public URL"
                                        >
                                          <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => window.open(publication.url, '_blank')}
                                          className="p-1 text-green-600 hover:text-green-800"
                                          title="Open in new tab"
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {doc.status === 'translated' && availableLanguages.length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedDocument(doc.id);
                              setPublishParams(prev => ({
                                ...prev,
                                selectedLanguages: [],
                                versionName: `v${Object.keys(doc.publications || {}).length + 1}.0`
                              }));
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            <Send className="w-3 h-3" />
                            Publish
                          </button>
                        )}
                        
                        {doc.status === 'published' && (
                          <button
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            <Eye className="w-3 h-3" />
                            View Publications
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Publishing Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Publishing Process
        </h3>
        <div className="text-green-800 space-y-2">
          <p><strong>1. Format Generation:</strong> Convert translations into target format (PDF, HTML, JSON, XML)</p>
          <p><strong>2. Layout Reconstruction:</strong> Apply original layout and styling to translated content</p>
          <p><strong>3. Quality Check:</strong> Validate output format and content integrity</p>
          <p><strong>4. Version Management:</strong> Create versioned publications with metadata</p>
          <p><strong>5. Access Control:</strong> Configure public/private access and distribution URLs</p>
        </div>
      </div>

      {/* Publishing Stats */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Publishing Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-blue-900">{documents.filter(d => d.status === 'translated').length}</div>
            <div className="text-blue-600 text-sm">Ready to Publish</div>
          </div>
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-green-900">{documents.filter(d => d.status === 'published').length}</div>
            <div className="text-green-600 text-sm">Published</div>
          </div>
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-purple-900">
              {documents.reduce((acc, d) => acc + Object.keys(d.publications || {}).length, 0)}
            </div>
            <div className="text-purple-600 text-sm">Total Versions</div>
          </div>
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-orange-900">
              {documents.reduce((acc, d) => {
                const langs = getAvailableLanguages(d);
                return acc + langs.length;
              }, 0)}
            </div>
            <div className="text-orange-600 text-sm">Available Languages</div>
          </div>
        </div>
      </div>
    </div>
  );
};
