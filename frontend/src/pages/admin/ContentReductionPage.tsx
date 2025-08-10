import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  RefreshCw, 
  CheckCircle,
  Play,
  Eye,
  FileText,
  X,
  Activity
} from 'lucide-react';
import axios from 'axios';
import './AdminPages.css';
import type { 
  AILogEntry, 
  ContentReductionResult, 
  ChunksResult,
  Document as BaseDocument
} from '../../types/api';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

// Extended Document interface for content reduction page
interface Document extends Omit<BaseDocument, 'status' | 'contentReduction'> {
  status: 'processed' | 'reducing' | 'reduced' | 'failed';
  contentReduction?: {
    totalGroups: number;
    languagesDetected: string[];
    processedAt: string;
    hasAiLogs?: boolean;
  };
}

// Interface for the backend reduction details response
interface ReductionDetailsResponse {
  reduction: ContentReductionResult;
  chunks: ChunksResult | null;
  summary: {
    totalGroups: number;
    languagesDetected: string[];
    processedAt: string;
    totalChunks: number;
  };
}

export const ContentReductionPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [viewingDetails, setViewingDetails] = useState<string | null>(null);
  const [reductionDetails, setReductionDetails] = useState<ReductionDetailsResponse | null>(null);
  const [loadingReductionDetails, setLoadingReductionDetails] = useState(false);
  const [aiLogs, setAiLogs] = useState<AILogEntry[]>([]);
  const [showAiLogs, setShowAiLogs] = useState(false);
  const [loadingAiLogs, setLoadingAiLogs] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Add escape key listener for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAiLogs) {
          closeAiLogsView();
        } else if (viewingDetails) {
          closeDetailsView();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAiLogs, viewingDetails]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/documents?limit=100`);
      // Only show documents that are ready for content reduction or already reduced
      const docs = (response.data.data || []).filter((doc: Document) => 
        doc.status === 'processed' || doc.status === 'reducing' || doc.status === 'reduced' || doc.status === 'failed'
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
      
      // Log the request details for debugging
      const url = `${API_BASE}/admin/documents/${documentId}/reduce`;
      console.log('Starting content reduction:', {
        documentId,
        url,
        API_BASE
      });
      
      // Use our fixed backend processor - no user configuration needed
      const response = await axios.post(url);

      if (response.data.success) {
        // Refresh documents to show updated status
        await fetchDocuments();
        
        // Show success message with details
        const result = response.data.data;
        alert(`Content reduction completed!

Groups created: ${result.totalGroups}
Languages detected: ${result.languagesDetected.join(', ')}
Chunks generated: ${result.chunksGenerated}`);
      }
    } catch (error: any) {
      console.error('Content reduction failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
      
      // More detailed error message
      let errorMessage = 'Content reduction failed';
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        errorMessage = `Request failed (${status}): ${data?.message || data?.error || error.response.statusText}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Check if backend is running.';
      } else {
        // Something else happened
        errorMessage = `Request error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const viewReductionDetails = async (documentId: string) => {
    try {
      setViewingDetails(documentId);
      setReductionDetails(null); // Clear any previous data
      setLoadingReductionDetails(true);
      
      console.log('Loading reduction details for document:', documentId);
      const response = await axios.get(`${API_BASE}/admin/documents/${documentId}/reduction-details`);
      
      console.log('Reduction details response:', response.data);
      
      if (response.data.success) {
        setReductionDetails(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to load reduction details');
      }
    } catch (error: any) {
      console.error('Failed to load reduction details:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      alert(`Failed to load reduction details: ${error.response?.data?.error || error.message}`);
      setViewingDetails(null);
      setReductionDetails(null);
    } finally {
      setLoadingReductionDetails(false);
    }
  };

  const viewAiLogs = async (documentId: string) => {
    try {
      // Clear previous logs and show loading state
      setAiLogs([]);
      setShowAiLogs(true);
      setLoadingAiLogs(true);
      
      console.log('Loading AI logs for document:', documentId);
      const response = await axios.get(`${API_BASE}/admin/documents/${documentId}/ai-logs`);
      
      console.log('AI logs response:', response.data);
      
      if (response.data.success) {
        setAiLogs(response.data.data.aiLogs || []);
      } else {
        throw new Error(response.data.error || 'Failed to load AI logs');
      }
    } catch (error: any) {
      console.error('Failed to load AI logs:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      alert(`Failed to load AI logs: ${error.response?.data?.error || error.message}`);
      setShowAiLogs(false);
      setAiLogs([]);
    } finally {
      setLoadingAiLogs(false);
    }
  };

  const closeDetailsView = () => {
    setViewingDetails(null);
    setReductionDetails(null);
    setLoadingReductionDetails(false);
  };

  const closeAiLogsView = () => {
    setShowAiLogs(false);
    setAiLogs([]);
    setLoadingAiLogs(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'processed':
        return 'status-ready';
      case 'reducing':
        return 'status-processing';
      case 'reduced':
        return 'status-success';
      case 'failed':
        return 'status-error';
      default:
        return 'status-default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processed':
        return 'Ready for Reduction';
      case 'reducing':
        return 'Processing...';
      case 'reduced':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
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

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-section">
        <div className="admin-page-header">
          <div className="admin-page-title">
            <GitBranch className="admin-page-icon" />
            <h1>Content Reduction</h1>
          </div>
        </div>

        {/* Document List */}
        {documents.length === 0 ? (
          <div className="admin-empty-state">
            <GitBranch className="admin-empty-icon" />
            <h3>No documents ready</h3>
            <p>Upload and process PDF documents first to enable content reduction.</p>
          </div>
        ) : (
          <div className="admin-document-list">
            {documents.map((doc) => (
              <div key={doc.id} className="admin-document-item">
                <div className="admin-document-header">
                  <div className="admin-document-info">
                    <div className="admin-document-title-row">
                      <h3 className="admin-document-name">
                        {doc.originalName}
                      </h3>
                      <div className={`admin-status-badge ${getStatusBadgeClass(doc.status)}`}>
                        {doc.status === 'reduced' ? (
                          <CheckCircle className="admin-status-icon" />
                        ) : doc.status === 'reducing' ? (
                          <RefreshCw className="admin-status-icon animate-spin" />
                        ) : (
                          <FileText className="admin-status-icon" />
                        )}
                        <span>{getStatusText(doc.status)}</span>
                      </div>
                    </div>

                    {doc.contentReduction ? (
                      <>
                        <div className="admin-stats-grid">
                          <div className="admin-stat success">
                            <div className="stat-value">{doc.contentReduction.totalGroups}</div>
                            <div className="stat-label">Text Groups</div>
                          </div>
                          <div className="admin-stat info">
                            <div className="stat-value">{doc.contentReduction.languagesDetected.length}</div>
                            <div className="stat-label">Languages</div>
                          </div>
                          <div className="admin-stat purple">
                            <div className="stat-value">
                              {new Date(doc.contentReduction.processedAt).toLocaleDateString()}
                            </div>
                            <div className="stat-label">Processed</div>
                          </div>
                        </div>

                        <div className="admin-language-tags">
                          <span className="language-label">Detected Languages:</span>
                          {doc.contentReduction.languagesDetected.map(lang => (
                            <span key={lang} className="language-tag">
                              {lang.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="admin-stats-grid">
                        <div className="admin-stat info">
                          <div className="stat-value">{doc.stats?.pageCount || 0}</div>
                          <div className="stat-label">Pages</div>
                        </div>
                        <div className="admin-stat default">
                          <div className="stat-value">Ready</div>
                          <div className="stat-label">For Processing</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="admin-document-actions">
                    {doc.status === 'processed' && (
                      <button
                        onClick={() => startContentReduction(doc.id)}
                        disabled={processing.has(doc.id)}
                        className="admin-btn primary"
                      >
                        {processing.has(doc.id) ? (
                          <>
                            <RefreshCw className="admin-btn-icon animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Play className="admin-btn-icon" />
                            Start Reduction
                          </>
                        )}
                      </button>
                    )}
                    
                    {doc.status === 'reduced' && (
                      <>
                        <button
                          onClick={() => viewReductionDetails(doc.id)}
                          className="admin-btn success"
                        >
                          <Eye className="admin-btn-icon" />
                          View Results
                        </button>
                        
                        {(doc.contentReduction?.hasAiLogs || doc.storage?.aiLogsKey) && (
                          <button
                            onClick={() => viewAiLogs(doc.id)}
                            className="admin-btn secondary"
                          >
                            <Activity className="admin-btn-icon" />
                            AI Logs
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Process Information */}
      <div className="admin-info-section">
        <h3>Content Reduction Process</h3>
        <div className="admin-process-steps">
          <div className="process-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Text Grouping</h4>
              <p>AI identifies and groups repeated content (titles, paragraphs, lists)</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Language Detection</h4>
              <p>Automatically detects languages present in the document</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Semantic Analysis</h4>
              <p>Groups related content across different languages</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Structure Preservation</h4>
              <p>Maintains layout information and bounding boxes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="admin-stats-section">
        <h3>Reduction Progress</h3>
        <div className="admin-stats-grid">
          <div className="admin-stat-card info">
            <div className="stat-value">{documents.filter(d => d.status === 'processed').length}</div>
            <div className="stat-label">Ready for Reduction</div>
          </div>
          <div className="admin-stat-card success">
            <div className="stat-value">{documents.filter(d => d.status === 'reduced').length}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="admin-stat-card purple">
            <div className="stat-value">
              {documents.reduce((acc, d) => acc + (d.contentReduction?.totalGroups || 0), 0)}
            </div>
            <div className="stat-label">Total Text Groups</div>
          </div>
          <div className="admin-stat-card warning">
            <div className="stat-value">
              {new Set(documents.flatMap(d => d.contentReduction?.languagesDetected || [])).size}
            </div>
            <div className="stat-label">Unique Languages</div>
          </div>
        </div>
      </div>

      {/* Reduction Details Modal */}
      {viewingDetails && (
        <div className="admin-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) closeDetailsView();
        }}>
          <div className="admin-modal large">
            <div className="admin-modal-header">
              <h2>Content Reduction Details</h2>
              <button onClick={closeDetailsView} className="admin-modal-close">
                <X />
              </button>
            </div>
            
            <div className="admin-modal-content">
              {loadingReductionDetails ? (
                <div className="admin-loading">
                  <div className="admin-loading-content">
                    <RefreshCw className="admin-loading-spinner" />
                    <span>Loading reduction details...</span>
                  </div>
                </div>
              ) : reductionDetails ? (
                <>
                  {/* Summary */}
                  <div className="reduction-summary">
                    <div className="summary-stats">
                      <div className="summary-stat">
                        <div className="stat-value">{reductionDetails.summary.totalGroups}</div>
                        <div className="stat-label">Total Groups</div>
                      </div>
                      <div className="summary-stat">
                        <div className="stat-value">{reductionDetails.summary.languagesDetected.length}</div>
                        <div className="stat-label">Languages</div>
                      </div>
                      <div className="summary-stat">
                        <div className="stat-value">{reductionDetails.summary.totalChunks}</div>
                        <div className="stat-label">Chunks Generated</div>
                      </div>
                      <div className="summary-stat">
                        <div className="stat-value">100%</div>
                        <div className="stat-label">Avg Confidence</div>
                      </div>
                    </div>
                    
                    <div className="processing-info">
                      <p><strong>Processed:</strong> {new Date(reductionDetails.summary.processedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Language Distribution */}
                  <div className="section">
                    <h4>Language Distribution</h4>
                    <div className="language-distribution">
                      {reductionDetails.summary.languagesDetected.map((lang) => (
                        <div key={lang} className="language-bar">
                          <span className="language-name">{lang.toUpperCase()}</span>
                          <div className="bar">
                            <div 
                              className="bar-fill"
                              style={{ 
                                width: `${(1 / reductionDetails.summary.languagesDetected.length) * 100}%`
                              }}
                            />
                          </div>
                          <span className="language-count">
                            {reductionDetails.reduction.groups.filter(g => g.originalTexts.some(t => t.language === lang)).length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content Type Distribution */}
                  <div className="section">
                    <h4>Content Type Distribution</h4>
                    <div className="type-distribution">
                      {['title', 'paragraph', 'list', 'table', 'other'].map((type) => {
                        const count = reductionDetails.reduction.groups.filter(g => g.type === type).length;
                        return count > 0 ? (
                          <div key={type} className="type-item">
                            <span className="type-name">{type}</span>
                            <span className="type-count">{count}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {/* Groups */}
                  <div className="section">
                    <h4>Content Groups ({reductionDetails.reduction.groups.length})</h4>
                    <div className="groups-list">
                      {reductionDetails.reduction.groups.slice(0, 10).map((group) => (
                        <div key={group.id} className="group-item">
                          <div className="group-header">
                            <span className="group-type">{group.type}</span>
                            <span className="group-lang">
                              {group.originalTexts.map(t => t.language.toUpperCase()).join(', ')}
                            </span>
                            <span className="group-confidence">
                              {Math.round((group.originalTexts[0]?.confidence || 1) * 100)}%
                            </span>
                            <span className="group-page">Page {group.pageNumber}</span>
                          </div>
                          <div className="group-text">
                            {group.originalTexts[0]?.text}
                          </div>
                        </div>
                      ))}
                      {reductionDetails.reduction.groups.length > 10 && (
                        <div className="groups-more">
                          +{reductionDetails.reduction.groups.length - 10} more groups
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Markdown Chunks */}
                  {reductionDetails.chunks && (
                    <div className="section">
                      <h4>Markdown Chunks ({reductionDetails.chunks.chunks.length})</h4>
                      <div className="chunks-list">
                        {reductionDetails.chunks.chunks.map((chunk) => (
                          <div key={chunk.id} className="chunk-item">
                            <div className="chunk-header">
                              <span className="chunk-id">ID: {chunk.id}</span>
                              <span className="chunk-lang">{chunk.language.toUpperCase()}</span>
                              <span className="chunk-type">{chunk.metadata.chunkType}</span>
                              <span className="chunk-pages">
                                Pages: {chunk.pageNumbers.join(', ')}
                              </span>
                            </div>
                            <div className="chunk-content">
                              <h5>Markdown Content:</h5>
                              <pre className="markdown-preview">{chunk.content}</pre>
                            </div>
                            {chunk.sourceGroups.length > 0 && (
                              <div className="chunk-source-groups">
                                <h6>Source Groups:</h6>
                                <div className="source-groups-list">
                                  {chunk.sourceGroups.map(groupId => (
                                    <span key={groupId} className="source-group-id">{groupId}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="admin-empty-state">
                  <FileText className="admin-empty-icon" />
                  <h3>No details available</h3>
                  <p>Failed to load reduction details for this document.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Logs Modal */}
      {showAiLogs && (
        <div className="admin-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) closeAiLogsView();
        }}>
          <div className="admin-modal large">
            <div className="admin-modal-header">
              <h2>AI Processing Logs</h2>
              <button onClick={closeAiLogsView} className="admin-modal-close">
                <X />
              </button>
            </div>
            
            <div className="admin-modal-content">
              {loadingAiLogs ? (
                <div className="admin-loading">
                  <div className="admin-loading-content">
                    <RefreshCw className="admin-loading-spinner" />
                    <span>Loading AI logs...</span>
                  </div>
                </div>
              ) : aiLogs.length > 0 ? (
                <div className="ai-logs-list">
                  {aiLogs.map((log, index) => (
                    <div key={index} className="ai-log-entry">
                      <div className="log-header">
                        <span className="log-operation">{log.phase}</span>
                        <span className="log-model">{log.model || 'Unknown'}</span>
                        <span className="log-timestamp">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="log-content">
                        {log.prompt && (
                          <div className="log-input">
                            <h5>Prompt:</h5>
                            <pre>{log.prompt}</pre>
                          </div>
                        )}
                        {log.response && (
                          <div className="log-output">
                            <h5>Response:</h5>
                            <pre>{log.response}</pre>
                          </div>
                        )}
                        {log.error && (
                          <div className="log-error">
                            <h5>Error:</h5>
                            <pre>{log.error}</pre>
                          </div>
                        )}
                        {log.fallback && (
                          <div className="log-fallback">
                            <h5>Fallback Used:</h5>
                            <pre>{log.fallback}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-empty-state">
                  <Activity className="admin-empty-icon" />
                  <h3>No AI logs available</h3>
                  <p>No processing logs found for this document.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
