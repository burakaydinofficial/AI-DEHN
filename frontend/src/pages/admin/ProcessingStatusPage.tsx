import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Clock,
  Calendar,
  Activity
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
}

export const ProcessingStatusPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE}/admin/documents`);
      setDocuments(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    
    // Set up polling for processing documents
    const interval = setInterval(() => {
      // Check if there are any processing documents before fetching
      fetchDocuments();
    }, 10000); // Poll every 10 seconds instead of 5

    return () => clearInterval(interval);
  }, []); // Remove documents dependency to prevent infinite loop

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'processed':
        return 'processed';
      case 'processing':
        return 'processing';
      case 'failed':
        return 'failed';
      default:
        return 'default';
    }
  };

  const getProcessingDuration = (uploadedAt: string, processedAt?: string) => {
    const start = new Date(uploadedAt);
    const end = processedAt ? new Date(processedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`;
    }
    return `${diffSecs}s`;
  };

  const processingCount = documents.filter(doc => doc.status === 'processing').length;
  const processedCount = documents.filter(doc => doc.status === 'processed').length;
  const failedCount = documents.filter(doc => doc.status === 'failed').length;

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-title">
          <Activity className="admin-page-icon" />
          <h1>Processing Status</h1>
        </div>
        <button
          onClick={fetchDocuments}
          disabled={loading}
          className="admin-btn admin-btn-primary"
        >
          <RefreshCw className={`admin-btn-icon ${loading ? 'admin-loading-spinner' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Summary */}
      <div className="admin-stats-summary">
        <div className="admin-stats-grid">
          <div className="admin-stats-item">
            <div className="admin-stats-value processing">{processingCount}</div>
            <div className="admin-stats-label">Processing</div>
          </div>
          <div className="admin-stats-item">
            <div className="admin-stats-value completed">{processedCount}</div>
            <div className="admin-stats-label">Completed</div>
          </div>
          <div className="admin-stats-item">
            <div className="admin-stats-value failed">{failedCount}</div>
            <div className="admin-stats-label">Failed</div>
          </div>
          <div className="admin-stats-item">
            <div className="admin-stats-value total">{documents.length}</div>
            <div className="admin-stats-label">Total</div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="admin-error">
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="admin-loading">
          <div className="admin-loading-content">
            <RefreshCw className="admin-loading-spinner" />
            <span>Loading documents...</span>
          </div>
        </div>
      )}

      {/* Documents Table */}
      {!loading && !error && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Size</th>
                <th>Status</th>
                <th>Processing Time</th>
                <th>Stats</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div className="admin-doc-info">
                      <FileText className="admin-doc-icon" />
                      <div className="admin-doc-details">
                        <div className="admin-doc-name">{doc.originalName}</div>
                        <div className="admin-doc-meta">ID: {doc.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="admin-file-size">
                      {(doc.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStatusIcon(doc.status)}
                      <span className={`admin-status-badge ${getStatusBadgeClass(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                    {doc.error && (
                      <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>{doc.error}</div>
                    )}
                  </td>
                  <td>
                    <div className="admin-date-info">
                      <Clock className="admin-date-icon" />
                      <div className="admin-date-main">{getProcessingDuration(doc.uploadedAt, doc.processedAt)}</div>
                    </div>
                    <div className="admin-date-time">
                      <Calendar className="admin-date-icon" />
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    {doc.stats && (
                      <div className="admin-stats-list">
                        {doc.stats.pageCount && <div>{doc.stats.pageCount} pages</div>}
                        {doc.stats.totalChars && <div>{doc.stats.totalChars.toLocaleString()} chars</div>}
                        {doc.stats.imagesCount && <div>{doc.stats.imagesCount} images</div>}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        onClick={() => window.open(`/documents/${doc.id}`, '_blank')}
                        className="admin-action-btn primary"
                        title="View Details"
                      >
                        <Eye className="admin-action-icon" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="admin-empty">
                    No documents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
