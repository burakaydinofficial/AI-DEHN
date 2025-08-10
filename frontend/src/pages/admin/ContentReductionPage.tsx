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
import type { AILogEntry } from '../../types/api';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  status: 'processed' | 'reducing' | 'reduced' | 'failed';
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
    hasAiLogs?: boolean;
  };
}

interface ContentReductionGroup {
  id: string;
  type: 'title' | 'paragraph' | 'list' | 'other';
  originalText: string;
  detectedLanguage: string;
  confidence: number;
  wordCount: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  page: number;
}

interface DetailedReductionResult {
  documentId: string;
  totalGroups: number;
  languagesDetected: string[];
  processedAt: string;
  processingModel: string;
  chunksGenerated: number;
  groups: ContentReductionGroup[];
  statistics: {
    averageConfidence: number;
    languageDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
  };
}

export const ContentReductionPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [viewingDetails, setViewingDetails] = useState<string | null>(null);
  const [reductionDetails, setReductionDetails] = useState<DetailedReductionResult | null>(null);
  const [aiLogs, setAiLogs] = useState<AILogEntry[]>([]);
  const [showAiLogs, setShowAiLogs] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

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
      
      // Use our fixed backend processor - no user configuration needed
      const response = await axios.post(`${API_BASE}/admin/documents/${documentId}/reduce`);

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
      alert(error.response?.data?.message || error.response?.data?.error || 'Content reduction failed');
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
      const response = await axios.get(`${API_BASE}/admin/documents/${documentId}/reduction-details`);
      
      if (response.data.success) {
        setReductionDetails(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load reduction details:', error);
      alert('Failed to load reduction details');
      setViewingDetails(null);
    }
  };

  const viewAiLogs = async (documentId: string) => {
    try {
      const response = await axios.get(`${API_BASE}/admin/documents/${documentId}/ai-logs`);
      
      if (response.data.success) {
        setAiLogs(response.data.data);
        setShowAiLogs(true);
      }
    } catch (error: any) {
      console.error('Failed to load AI logs:', error);
      alert('Failed to load AI logs');
    }
  };

  const closeDetailsView = () => {
    setViewingDetails(null);
    setReductionDetails(null);
  };

  const closeAiLogsView = () => {
    setShowAiLogs(false);
    setAiLogs([]);
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
        <p className="admin-section-description">
          AI-powered content reduction using Gemini 1.5 Pro. 
          Automatically detects languages, groups content, and prepares documents for translation.
        </p>

        {/* Configuration Info */}
        <div className="admin-info-card">
          <h3>AI Configuration</h3>
          <div className="admin-config-info">
            <div className="config-item">
              <strong>Model:</strong> Gemini 1.5 Pro
            </div>
            <div className="config-item">
              <strong>Strategy:</strong> Mixed content grouping (titles + paragraphs)
            </div>
            <div className="config-item">
              <strong>Language Detection:</strong> 70% confidence threshold
            </div>
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
                        
                        {doc.contentReduction?.hasAiLogs && (
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
      {viewingDetails && reductionDetails && (
        <div className="admin-modal-overlay">
          <div className="admin-modal large">
            <div className="admin-modal-header">
              <h2>Content Reduction Details</h2>
              <button onClick={closeDetailsView} className="admin-modal-close">
                <X />
              </button>
            </div>
            
            <div className="admin-modal-content">
              {/* Summary */}
              <div className="reduction-summary">
                <div className="summary-stats">
                  <div className="summary-stat">
                    <div className="stat-value">{reductionDetails.totalGroups}</div>
                    <div className="stat-label">Total Groups</div>
                  </div>
                  <div className="summary-stat">
                    <div className="stat-value">{reductionDetails.languagesDetected.length}</div>
                    <div className="stat-label">Languages</div>
                  </div>
                  <div className="summary-stat">
                    <div className="stat-value">{reductionDetails.chunksGenerated}</div>
                    <div className="stat-label">Chunks Generated</div>
                  </div>
                  <div className="summary-stat">
                    <div className="stat-value">{Math.round(reductionDetails.statistics.averageConfidence * 100)}%</div>
                    <div className="stat-label">Avg Confidence</div>
                  </div>
                </div>
                
                <div className="processing-info">
                  <p><strong>Model:</strong> {reductionDetails.processingModel}</p>
                  <p><strong>Processed:</strong> {new Date(reductionDetails.processedAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Language Distribution */}
              <div className="section">
                <h4>Language Distribution</h4>
                <div className="language-distribution">
                  {Object.entries(reductionDetails.statistics.languageDistribution).map(([lang, count]) => (
                    <div key={lang} className="language-bar">
                      <span className="language-name">{lang.toUpperCase()}</span>
                      <div className="bar">
                        <div 
                          className="bar-fill"
                          style={{ 
                            width: `${(count / reductionDetails.totalGroups) * 100}%`
                          }}
                        />
                      </div>
                      <span className="language-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Type Distribution */}
              <div className="section">
                <h4>Content Type Distribution</h4>
                <div className="type-distribution">
                  {Object.entries(reductionDetails.statistics.typeDistribution).map(([type, count]) => (
                    <div key={type} className="type-item">
                      <span className="type-name">{type}</span>
                      <span className="type-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Groups */}
              <div className="section">
                <h4>Content Groups ({reductionDetails.groups.length})</h4>
                <div className="groups-list">
                  {reductionDetails.groups.slice(0, 10).map((group) => (
                    <div key={group.id} className="group-item">
                      <div className="group-header">
                        <span className="group-type">{group.type}</span>
                        <span className="group-lang">{group.detectedLanguage.toUpperCase()}</span>
                        <span className="group-confidence">{Math.round(group.confidence * 100)}%</span>
                        <span className="group-page">Page {group.page}</span>
                      </div>
                      <div className="group-text">
                        {group.originalText.substring(0, 200)}
                        {group.originalText.length > 200 && '...'}
                      </div>
                    </div>
                  ))}
                  {reductionDetails.groups.length > 10 && (
                    <div className="groups-more">
                      +{reductionDetails.groups.length - 10} more groups
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Logs Modal */}
      {showAiLogs && (
        <div className="admin-modal-overlay">
          <div className="admin-modal large">
            <div className="admin-modal-header">
              <h2>AI Processing Logs</h2>
              <button onClick={closeAiLogsView} className="admin-modal-close">
                <X />
              </button>
            </div>
            
            <div className="admin-modal-content">
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
                          <pre>{log.prompt.substring(0, 500)}{log.prompt.length > 500 && '...'}</pre>
                        </div>
                      )}
                      {log.response && (
                        <div className="log-output">
                          <h5>Response:</h5>
                          <pre>{log.response.substring(0, 500)}{log.response.length > 500 && '...'}</pre>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
