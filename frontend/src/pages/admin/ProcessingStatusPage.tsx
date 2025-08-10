import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Download,
  Image,
  FileType
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  status: 'processing' | 'processed' | 'reduced' | 'failed';
  uploadedAt: string;
  processedAt?: string;
  error?: string;
  metadata?: {
    title?: string;
    author?: string;
    page_count?: number;
  };
  stats?: {
    pageCount?: number;
    totalChars?: number;
    imagesCount?: number;
  };
  storage?: {
    originalPdf?: string;
    analysisJson?: string;
    zipBundle?: string;
    imagesPrefix?: string;
  };
}

export const ProcessingStatusPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments();
    // Set up polling for processing documents
    const interval = setInterval(fetchDocuments, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/documents`);
      setDocuments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reduced':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'processed':
      case 'reduced':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getNextAction = (doc: Document) => {
    switch (doc.status) {
      case 'processing':
        return 'Processing...';
      case 'processed':
        return 'Ready for Content Reduction';
      case 'reduced':
        return 'Ready for Translation';
      case 'failed':
        return 'Processing Failed';
      default:
        return 'Unknown Status';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
          Processing Status
        </h2>
        <p className="text-gray-600 mb-6">
          Monitor the status of uploaded PDF documents through the extraction and processing pipeline.
        </p>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600">Upload PDF documents to see their processing status here.</p>
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
                        {getStatusIcon(doc.status)}
                        <span className="capitalize">{doc.status}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Size:</span> {formatFileSize(doc.size)}
                      </div>
                      <div>
                        <span className="font-medium">Uploaded:</span> {formatDate(doc.uploadedAt)}
                      </div>
                      {doc.processedAt && (
                        <div>
                          <span className="font-medium">Processed:</span> {formatDate(doc.processedAt)}
                        </div>
                      )}
                      {doc.stats?.pageCount && (
                        <div>
                          <span className="font-medium">Pages:</span> {doc.stats.pageCount}
                        </div>
                      )}
                    </div>

                    {doc.stats && (
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="font-medium text-blue-900">{doc.stats.pageCount || 0}</div>
                          <div className="text-blue-600">Pages</div>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <div className="font-medium text-green-900">{doc.stats.totalChars || 0}</div>
                          <div className="text-green-600">Characters</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <div className="font-medium text-purple-900">{doc.stats.imagesCount || 0}</div>
                          <div className="text-purple-600">Images</div>
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Next Action:</span> {getNextAction(doc)}
                    </div>

                    {doc.error && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-red-800">Processing Error</div>
                            <div className="text-red-700 text-sm">{doc.error}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processing Pipeline Info */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Processing Pipeline Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-blue-900">{documents.filter(d => d.status === 'processing').length}</div>
            <div className="text-blue-600 text-sm">Processing</div>
          </div>
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-green-900">{documents.filter(d => d.status === 'processed').length}</div>
            <div className="text-green-600 text-sm">Ready for Reduction</div>
          </div>
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-purple-900">{documents.filter(d => d.status === 'reduced').length}</div>
            <div className="text-purple-600 text-sm">Content Reduced</div>
          </div>
          <div className="text-center p-4 bg-white rounded border">
            <div className="font-medium text-red-900">{documents.filter(d => d.status === 'failed').length}</div>
            <div className="text-red-600 text-sm">Failed</div>
          </div>
        </div>
      </div>

      {/* Document Details Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Document Details
                </h3>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Name</label>
                  <div className="text-gray-900">{selectedDoc.originalName}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document ID</label>
                  <div className="text-gray-900 font-mono text-sm">{selectedDoc.id}</div>
                </div>
                {selectedDoc.metadata && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PDF Metadata</label>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      {selectedDoc.metadata.title && <div><strong>Title:</strong> {selectedDoc.metadata.title}</div>}
                      {selectedDoc.metadata.author && <div><strong>Author:</strong> {selectedDoc.metadata.author}</div>}
                      {selectedDoc.metadata.page_count && <div><strong>Pages:</strong> {selectedDoc.metadata.page_count}</div>}
                    </div>
                  </div>
                )}
                {selectedDoc.storage && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Processing Artifacts</label>
                    <div className="space-y-2">
                      {selectedDoc.storage.originalPdf && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-500" />
                          <span className="text-sm">Original PDF stored</span>
                        </div>
                      )}
                      {selectedDoc.storage.analysisJson && (
                        <div className="flex items-center gap-2">
                          <FileType className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">Analysis JSON available</span>
                        </div>
                      )}
                      {selectedDoc.storage.zipBundle && (
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-green-500" />
                          <span className="text-sm">ZIP bundle with extracted content</span>
                        </div>
                      )}
                      {selectedDoc.storage.imagesPrefix && (
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-purple-500" />
                          <span className="text-sm">Extracted images available</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
