import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  RefreshCw, 
  CheckCircle,
  Play,
  Eye,
  FileText
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  status: 'processed' | 'reduced' | 'failed';
  availableLanguages?: string[];
  stats?: {
    pageCount?: number;
    languagesDetected?: number;
    textGroupsCount?: number;
  };
  contentReduction?: {
    totalGroups: number;
    languagesDetected: string[];
    processedAt: string;
  };
}

interface ReductionParams {
  aiModel: string;
  groupingStrategy: string;
  languageDetectionThreshold: number;
}

export const ContentReductionPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [reductionParams, setReductionParams] = useState<ReductionParams>({
    aiModel: 'gemini-1.5-pro',
    groupingStrategy: 'mixed',
    languageDetectionThreshold: 0.7
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/documents`);
      // Only show documents that are ready for content reduction
      const docs = (response.data.data || []).filter((doc: Document) => 
        doc.status === 'processed' || doc.status === 'reduced'
      );
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const startContentReduction = async (documentId: string) => {
    try {
      setProcessing(prev => new Set(prev).add(documentId));
      
      const response = await axios.post(`${API_BASE}/admin/documents/${documentId}/reduce`, {
        aiModel: reductionParams.aiModel,
        groupingStrategy: reductionParams.groupingStrategy,
        languageDetectionThreshold: reductionParams.languageDetectionThreshold
      });

      if (response.data.success) {
        // Refresh documents to show updated status
        await fetchDocuments();
      }
    } catch (error: any) {
      console.error('Content reduction failed:', error);
      alert(error.response?.data?.message || 'Content reduction failed');
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reduced':
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
          Content Reduction
        </h2>
        <p className="text-gray-600 mb-6">
          Use AI to detect and group repeated components across different languages. 
          This step identifies text groups, detects languages, and prepares content for translation.
        </p>

        {/* Reduction Parameters */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">AI Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Model
              </label>
              <select
                value={reductionParams.aiModel}
                onChange={(e) => setReductionParams(prev => ({ ...prev, aiModel: e.target.value }))}
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
                Grouping Strategy
              </label>
              <select
                value={reductionParams.groupingStrategy}
                onChange={(e) => setReductionParams(prev => ({ ...prev, groupingStrategy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mixed">Mixed (Titles + Paragraphs)</option>
                <option value="titles">Titles Only</option>
                <option value="paragraphs">Paragraphs Only</option>
                <option value="semantic">Semantic Grouping</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language Detection Threshold
              </label>
              <select
                value={reductionParams.languageDetectionThreshold}
                onChange={(e) => setReductionParams(prev => ({ ...prev, languageDetectionThreshold: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0.5}>50% (Lower confidence)</option>
                <option value={0.7}>70% (Balanced)</option>
                <option value={0.9}>90% (High confidence)</option>
              </select>
            </div>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents ready</h3>
            <p className="text-gray-600">Upload and process PDF documents first to enable content reduction.</p>
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
                        {doc.status === 'reduced' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <FileText className="w-3 h-3" />
                        )}
                        <span className="capitalize">
                          {doc.status === 'processed' ? 'Ready for Reduction' : doc.status}
                        </span>
                      </div>
                    </div>

                    {doc.contentReduction ? (
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div className="bg-green-50 p-2 rounded">
                          <div className="font-medium text-green-900">{doc.contentReduction.totalGroups}</div>
                          <div className="text-green-600">Text Groups</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="font-medium text-blue-900">{doc.contentReduction.languagesDetected.length}</div>
                          <div className="text-blue-600">Languages</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <div className="font-medium text-purple-900">
                            {new Date(doc.contentReduction.processedAt).toLocaleDateString()}
                          </div>
                          <div className="text-purple-600">Processed</div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="font-medium text-blue-900">{doc.stats?.pageCount || 0}</div>
                          <div className="text-blue-600">Pages</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="font-medium text-gray-900">Ready</div>
                          <div className="text-gray-600">For Processing</div>
                        </div>
                      </div>
                    )}

                    {doc.contentReduction && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        <span className="text-sm font-medium text-gray-700 mr-2">Detected Languages:</span>
                        {doc.contentReduction.languagesDetected.map(lang => (
                          <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {lang.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {doc.status === 'processed' && (
                      <button
                        onClick={() => startContentReduction(doc.id)}
                        disabled={processing.has(doc.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing.has(doc.id) ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            Start Reduction
                          </>
                        )}
                      </button>
                    )}
                    
                    {doc.status === 'reduced' && (
                      <button
                        onClick={() => console.log('View results for:', doc.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        <Eye className="w-3 h-3" />
                        View Results
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content Reduction Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Content Reduction Process
        </h3>
        <div className="text-blue-800 space-y-2">
          <p><strong>1. Text Grouping:</strong> AI identifies and groups repeated content (titles, paragraphs, lists)</p>
          <p><strong>2. Language Detection:</strong> Automatically detects languages present in the document</p>
          <p><strong>3. Semantic Analysis:</strong> Groups related content across different languages</p>
          <p><strong>4. Structure Preservation:</strong> Maintains layout information and bounding boxes</p>
          <p><strong>5. Preparation for Translation:</strong> Creates structured data ready for multilingual generation</p>
        </div>
      </div>

      {/* Processing Stats */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Reduction Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-blue-900">{documents.filter(d => d.status === 'processed').length}</div>
            <div className="text-blue-600 text-sm">Ready for Reduction</div>
          </div>
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-green-900">{documents.filter(d => d.status === 'reduced').length}</div>
            <div className="text-green-600 text-sm">Reduced</div>
          </div>
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-purple-900">
              {documents.reduce((acc, d) => acc + (d.contentReduction?.totalGroups || 0), 0)}
            </div>
            <div className="text-purple-600 text-sm">Total Text Groups</div>
          </div>
        </div>
      </div>
    </div>
  );
};
