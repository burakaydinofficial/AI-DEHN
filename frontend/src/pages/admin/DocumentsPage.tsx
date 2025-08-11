import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  Download,
  Calendar,
  BarChart3
} from 'lucide-react';
import axios from 'axios';
import './AdminPages.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

// Document status constants
const DOCUMENT_STATUS = {
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  REDUCING: 'reducing', 
  REDUCED: 'reduced',
  TRANSLATING: 'translating',
  TRANSLATED: 'translated',
  FAILED: 'failed'
} as const;

type DocumentStatus = typeof DOCUMENT_STATUS[keyof typeof DOCUMENT_STATUS];

interface Document {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  status: DocumentStatus;
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

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [renameDialog, setRenameDialog] = useState<{
    isOpen: boolean;
    documentId: string;
    currentName: string;
  }>({
    isOpen: false,
    documentId: '',
    currentName: ''
  });
  const [newName, setNewName] = useState('');

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
  }, []);

  const handleRename = async () => {
    try {
      await axios.put(`${API_BASE}/admin/documents/${renameDialog.documentId}/rename`, {
        newName: newName
      });
      await fetchDocuments();
      setRenameDialog({ isOpen: false, documentId: '', currentName: '' });
      setNewName('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to rename document');
    }
  };

  const handleDelete = async (documentId: string) => {
    const document = documents.find(d => d.id === documentId);
    const documentName = document ? document.originalName : 'this document';
    
    if (!confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE}/admin/documents/${documentId}`);
      if (response.data.success) {
        setDocuments(docs => docs.filter(doc => doc.id !== documentId));
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case DOCUMENT_STATUS.PROCESSED:
        return <CheckCircle className="admin-status-icon success" />;
      case DOCUMENT_STATUS.PROCESSING:
        return <RefreshCw className="admin-status-icon processing animate-spin" />;
      case DOCUMENT_STATUS.REDUCED:
        return <BarChart3 className="admin-status-icon success" />;
      case DOCUMENT_STATUS.TRANSLATED:
        return <CheckCircle className="admin-status-icon success" />;
      case DOCUMENT_STATUS.FAILED:
        return <AlertCircle className="admin-status-icon error" />;
      default:
        return <Clock className="admin-status-icon processing" />;
    }
  };

  const getStatusBadgeClass = (status: DocumentStatus) => {
    switch (status) {
      case DOCUMENT_STATUS.PROCESSED:
      case DOCUMENT_STATUS.REDUCED:
      case DOCUMENT_STATUS.TRANSLATED:
        return 'processed';
      case DOCUMENT_STATUS.PROCESSING:
        return 'processing';
      case DOCUMENT_STATUS.FAILED:
        return 'failed';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  function calculateAverageProcessingTime(docs: Document[]): string {
    const processedDocs = docs.filter(d => d.processedAt && d.uploadedAt);
    if (processedDocs.length === 0) return 'N/A';
    
    const totalTime = processedDocs.reduce((acc, doc) => {
      const start = new Date(doc.uploadedAt).getTime();
      const end = new Date(doc.processedAt!).getTime();
      return acc + (end - start);
    }, 0);
    
    const avgMs = totalTime / processedDocs.length;
    const avgMinutes = Math.round(avgMs / (1000 * 60));
    return `${avgMinutes}m`;
  }

  // Filter documents based on search and status
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: documents.length,
    processed: documents.filter(d => 
      d.status === DOCUMENT_STATUS.PROCESSED || 
      d.status === DOCUMENT_STATUS.REDUCED || 
      d.status === DOCUMENT_STATUS.TRANSLATED
    ).length,
    processing: documents.filter(d => d.status === DOCUMENT_STATUS.PROCESSING).length,
    failed: documents.filter(d => d.status === DOCUMENT_STATUS.FAILED).length,
    translated: documents.filter(d => d.status === DOCUMENT_STATUS.TRANSLATED).length,
    totalStorage: documents.reduce((acc, doc) => acc + doc.size, 0),
    avgProcessingTime: calculateAverageProcessingTime(documents),
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-content">
          <RefreshCw className="admin-loading-spinner" />
          <span>Loading documents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">
          <AlertCircle className="admin-error-icon" />
          <div>
            <h3>Error loading documents</h3>
            <p>{error}</p>
            <button onClick={fetchDocuments} className="admin-btn primary">
              <RefreshCw className="admin-btn-icon" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-section">
        <div className="admin-page-header">
          <div className="admin-page-title">
            <FileText className="admin-page-icon" />
            <h1>Documents</h1>
          </div>
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="admin-btn primary"
          >
            <RefreshCw className={`admin-btn-icon ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="admin-stats-section">
          <h3>Document Statistics</h3>
          <div className="admin-stats-grid">
            <div className="admin-stat-card info">
              <div className="admin-stat-header">
                <FileText className="admin-stat-icon" />
                <span className="stat-label">Total Documents</span>
              </div>
              <div className="stat-value">{stats.total}</div>
            </div>
            
            <div className="admin-stat-card success">
              <div className="admin-stat-header">
                <CheckCircle className="admin-stat-icon" />
                <span className="stat-label">Processed</span>
              </div>
              <div className="stat-value">{stats.processed}</div>
            </div>

            <div className="admin-stat-card warning">
              <div className="admin-stat-header">
                <Clock className="admin-stat-icon" />
                <span className="stat-label">Processing</span>
              </div>
              <div className="stat-value">{stats.processing}</div>
            </div>

            <div className="admin-stat-card error">
              <div className="admin-stat-header">
                <AlertCircle className="admin-stat-icon" />
                <span className="stat-label">Failed</span>
              </div>
              <div className="stat-value">{stats.failed}</div>
            </div>

            <div className="admin-stat-card purple">
              <div className="admin-stat-header">
                <Activity className="admin-stat-icon" />
                <span className="stat-label">Translated</span>
              </div>
              <div className="stat-value">{stats.translated}</div>
            </div>

            <div className="admin-stat-card secondary">
              <div className="admin-stat-header">
                <Download className="admin-stat-icon" />
                <span className="stat-label">Total Storage</span>
              </div>
              <div className="stat-value">{formatFileSize(stats.totalStorage)}</div>
            </div>

            <div className="admin-stat-card info">
              <div className="admin-stat-header">
                <Clock className="admin-stat-icon" />
                <span className="stat-label">Avg Processing</span>
              </div>
              <div className="stat-value">{stats.avgProcessingTime}</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="admin-form-group">
          <div className="admin-form-input-wrapper">
            <Search className="admin-form-input-icon" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-form-input with-icon"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-form-select"
          >
            <option value="all">All Status</option>
            <option value={DOCUMENT_STATUS.PROCESSING}>Processing</option>
            <option value={DOCUMENT_STATUS.PROCESSED}>Processed</option>
            <option value={DOCUMENT_STATUS.REDUCED}>Reduced</option>
            <option value={DOCUMENT_STATUS.TRANSLATED}>Translated</option>
            <option value={DOCUMENT_STATUS.FAILED}>Failed</option>
          </select>
        </div>

        {/* Error State */}
        {error && (
          <div className="admin-error">
            <p>{error}</p>
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
                  <th>Uploaded</th>
                  <th>Stats</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
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
                        {formatFileSize(doc.size || 0)}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${getStatusBadgeClass(doc.status)}`}>
                        {getStatusIcon(doc.status)}
                        {doc.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-date-info">
                        <Calendar className="admin-date-icon" />
                        <div className="admin-date-main">{new Date(doc.uploadedAt).toLocaleDateString()}</div>
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
                      {doc.error && (
                        <div className="admin-error-message">
                          <AlertCircle className="error-icon" />
                          <span>{doc.error}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          onClick={() => window.open(`/documents/${doc.id}`, '_blank')}
                          className="admin-action-btn primary"
                          title="View"
                        >
                          <Eye className="admin-action-icon" />
                        </button>
                        <button
                          onClick={() => {
                            setRenameDialog({
                              isOpen: true,
                              documentId: doc.id,
                              currentName: doc.originalName
                            });
                            setNewName(doc.originalName);
                          }}
                          className="admin-action-btn secondary"
                          title="Rename"
                        >
                          <Edit3 className="admin-action-icon" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="admin-action-btn danger"
                          title="Delete"
                        >
                          <Trash2 className="admin-action-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDocuments.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="admin-empty">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No documents match your search criteria' 
                        : 'No documents found'
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      {renameDialog.isOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3 className="admin-modal-title">Rename Document</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="admin-form-input"
              placeholder="Enter new name"
            />
            <div className="admin-modal-actions">
              <button
                onClick={() => {
                  setRenameDialog({ isOpen: false, documentId: '', currentName: '' });
                  setNewName('');
                }}
                className="admin-btn admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={!newName.trim()}
                className="admin-btn admin-btn-primary"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
