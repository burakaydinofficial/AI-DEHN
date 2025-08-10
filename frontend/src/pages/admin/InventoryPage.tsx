import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Search, 
  Edit3, 
  Trash2, 
  Eye,
  RefreshCw,
  FileText,
  Calendar
} from 'lucide-react';
import axios from 'axios';
import { Document } from '../../types/api';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

export const InventoryPage: React.FC = () => {
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

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const handleDelete = async (documentId: string, documentName: string) => {
    if (!confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await axios.delete(`${API_BASE}/admin/documents/${documentId}`);
      await fetchDocuments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete document');
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

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-title">
          <FolderOpen className="admin-page-icon" />
          <h1>Document Inventory</h1>
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
          <option value="processing">Processing</option>
          <option value="processed">Processed</option>
          <option value="failed">Failed</option>
        </select>
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
                      {(doc.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </td>
                  <td>
                    <span className={`admin-status-badge ${getStatusBadgeClass(doc.status)}`}>
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
                        onClick={() => handleDelete(doc.id, doc.originalName)}
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
