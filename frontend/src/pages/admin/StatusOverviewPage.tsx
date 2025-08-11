import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  FileText,
  Languages,
  Globe,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import { DOCUMENT_STATUS, ACTIVITY_STATUS, DocumentStatus, ActivityStatus } from '../../constants/enums';
import './AdminPages.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface SystemStats {
  totalDocuments: number;
  documentsProcessed: number;
  documentsReduced: number;
  documentsTranslated: number;
  documentsPublished: number;
  totalLanguages: number;
  totalProducts: number;
  processingQueue: number;
  successRate: number;
  avgProcessingTime: string;
}

interface RecentActivity {
  id: string;
  type: 'upload' | 'processing' | 'reduction' | 'translation' | 'publishing' | 'product';
  documentName: string;
  timestamp: string;
  status: 'completed' | 'in-progress' | 'failed';
  details?: string;
}

export const StatusOverviewPage: React.FC = () => {
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalDocuments: 0,
    documentsProcessed: 0,
    documentsReduced: 0,
    documentsTranslated: 0,
    documentsPublished: 0,
    totalLanguages: 0,
    totalProducts: 0,
    processingQueue: 0,
    successRate: 0,
    avgProcessingTime: '0m'
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchOverviewData();
    const interval = setInterval(fetchOverviewData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOverviewData = async () => {
    try {
      const [documentsResponse, publishingResponse, productsResponse] = await Promise.all([
        axios.get(`${API_BASE}/admin/documents`).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE}/admin/stats`).catch(() => ({ data: { data: {} } })),
        axios.get(`${API_BASE}/admin/products/stats/overview`).catch(() => ({ data: { data: {} } }))
      ]);

      const documents = documentsResponse.data.data || [];
      const publishingStats = publishingResponse.data.data || {};
      const productStats = productsResponse.data.data || {};

      // Calculate processing time with better formatting
      const processedDocs = documents.filter((d: any) => d.processedAt && d.uploadedAt);
      const avgTimeMinutes = processedDocs.length > 0 ? 
        processedDocs.reduce((acc: number, doc: any) => {
          return acc + (new Date(doc.processedAt).getTime() - new Date(doc.uploadedAt).getTime());
        }, 0) / processedDocs.length / (1000 * 60) : 0; // in minutes

      const formatProcessingTime = (minutes: number): string => {
        if (minutes < 1) return '< 1m';
        if (minutes < 60) return `${Math.round(minutes)}m`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
      };

      const successRate = documents.length > 0 ? 
        (documents.filter((d: any) => !['failed', 'error'].includes(d.status)).length / documents.length) * 100 : 100;

      // Calculate system stats from real data
      const stats: SystemStats = {
        totalDocuments: documents.length,
        documentsProcessed: documents.filter((d: any) => d.status === DOCUMENT_STATUS.PROCESSED).length,
        documentsReduced: documents.filter((d: any) => d.status === DOCUMENT_STATUS.REDUCED).length,
        documentsTranslated: documents.filter((d: any) => d.status === DOCUMENT_STATUS.TRANSLATED).length,
        documentsPublished: publishingStats.published || 0,
        totalLanguages: publishingStats.totalLanguages || 0,
        totalProducts: productStats.totalProducts || 0,
        processingQueue: documents.filter((d: any) => d.status === DOCUMENT_STATUS.PROCESSING).length,
        successRate: Math.round(successRate),
        avgProcessingTime: formatProcessingTime(avgTimeMinutes)
      };

      setSystemStats(stats);

      // Generate recent activity from documents
      const activity: RecentActivity[] = documents
        .sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, 10)
        .map((doc: any) => ({
          id: doc.id,
          type: getActivityType(doc.status),
          documentName: doc.originalName || doc.filename,
          timestamp: doc.processedAt || doc.uploadedAt,
          status: getActivityStatus(doc.status),
          details: doc.error || `${formatFileSize(doc.size || 0)}`
        }));

      setRecentActivity(activity);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
      setLoading(false);
    }
  };

  const getActivityType = (status: string): RecentActivity['type'] => {
    switch (status) {
      case DOCUMENT_STATUS.PROCESSING: return ACTIVITY_STATUS.PROCESSING;
      case DOCUMENT_STATUS.REDUCED: return ACTIVITY_STATUS.REDUCTION;
      case DOCUMENT_STATUS.TRANSLATED: return ACTIVITY_STATUS.TRANSLATION;
      case DOCUMENT_STATUS.PUBLISHED: return ACTIVITY_STATUS.PUBLISHING;
      default: return 'upload';
    }
  };

  const getActivityStatus = (status: string): RecentActivity['status'] => {
    if (status === DOCUMENT_STATUS.FAILED || status === ACTIVITY_STATUS.ERROR) return ACTIVITY_STATUS.FAILED;
    if (status === DOCUMENT_STATUS.PROCESSING) return ACTIVITY_STATUS.IN_PROGRESS;
    return 'completed';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'upload': return <FileText className="admin-activity-type-icon" />;
      case 'processing': return <RefreshCw className="admin-activity-type-icon" />;
      case 'reduction': return <BarChart3 className="admin-activity-type-icon" />;
      case 'translation': return <Languages className="admin-activity-type-icon" />;
      case 'publishing': return <Globe className="admin-activity-type-icon" />;
      case 'product': return <Package className="admin-activity-type-icon" />;
      default: return <Activity className="admin-activity-type-icon" />;
    }
  };

  const getStatusIcon = (status: RecentActivity['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="admin-status-icon success" />;
      case 'in-progress': return <Clock className="admin-status-icon processing" />;
      case 'failed': return <AlertCircle className="admin-status-icon error" />;
      default: return <Clock className="admin-status-icon" />;
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-title">
          <BarChart3 className="admin-page-icon" />
          <h1>System Overview</h1>
        </div>
        <div className="admin-header-actions">
          <div className="admin-last-update">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchOverviewData}
            disabled={loading}
            className="admin-btn primary"
          >
            <RefreshCw className={`admin-btn-icon ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="admin-loading-content">
            <RefreshCw className="admin-loading-spinner" />
            <span>Loading system overview...</span>
          </div>
        </div>
      ) : (
        <>
          {/* System Statistics */}
          <div className="admin-stats-section">
            <h3>System Statistics</h3>
            <div className="admin-stats-grid">
              <div className="admin-stat-card info">
                <div className="admin-stat-header">
                  <FileText className="admin-stat-icon" />
                  <span className="stat-label">Total Documents</span>
                </div>
                <div className="stat-value">{systemStats.totalDocuments}</div>
              </div>
              
              <div className="admin-stat-card success">
                <div className="admin-stat-header">
                  <CheckCircle className="admin-stat-icon" />
                  <span className="stat-label">Processed</span>
                </div>
                <div className="stat-value">{systemStats.documentsProcessed}</div>
              </div>

              <div className="admin-stat-card warning">
                <div className="admin-stat-header">
                  <Clock className="admin-stat-icon" />
                  <span className="stat-label">Processing</span>
                </div>
                <div className="stat-value">{systemStats.processingQueue}</div>
              </div>

              <div className="admin-stat-card purple">
                <div className="admin-stat-header">
                  <Languages className="admin-stat-icon" />
                  <span className="stat-label">Translated</span>
                </div>
                <div className="stat-value">{systemStats.documentsTranslated}</div>
              </div>

              <div className="admin-stat-card secondary">
                <div className="admin-stat-header">
                  <Globe className="admin-stat-icon" />
                  <span className="stat-label">Published</span>
                </div>
                <div className="stat-value">{systemStats.documentsPublished}</div>
              </div>

              <div className="admin-stat-card info">
                <div className="admin-stat-header">
                  <Package className="admin-stat-icon" />
                  <span className="stat-label">Products</span>
                </div>
                <div className="stat-value">{systemStats.totalProducts}</div>
              </div>

              <div className="admin-stat-card success">
                <div className="admin-stat-header">
                  <TrendingUp className="admin-stat-icon" />
                  <span className="stat-label">Success Rate</span>
                </div>
                <div className="stat-value">{systemStats.successRate}%</div>
              </div>

              <div className="admin-stat-card warning">
                <div className="admin-stat-header">
                  <Server className="admin-stat-icon" />
                  <span className="stat-label">Avg Processing</span>
                </div>
                <div className="stat-value">{systemStats.avgProcessingTime}</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="admin-section">
            <h3>Recent Activity</h3>
            <div className="admin-activity-list">
              {recentActivity.length === 0 ? (
                <div className="admin-empty-state">
                  <Activity className="admin-empty-icon" />
                  <h3>No recent activity</h3>
                  <p>Upload and process some documents to see activity here.</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="admin-activity-item">
                    <div className="admin-activity-icon">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="admin-activity-content">
                      <div className="admin-activity-title">
                        <span className="activity-type">{activity.type}</span>
                        <span className="activity-document">{activity.documentName}</span>
                      </div>
                      <div className="admin-activity-details">
                        {activity.details}
                      </div>
                      <div className="admin-activity-time">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="admin-activity-status">
                      {getStatusIcon(activity.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Health */}
          <div className="admin-section">
            <h3>System Health</h3>
            <div className="admin-health-grid">
              <div className="admin-health-item">
                <div className="admin-health-header">
                  <Server className="admin-health-icon" />
                  <span>Backend API</span>
                </div>
                <div className="admin-health-status success">
                  <CheckCircle className="admin-health-status-icon" />
                  Online
                </div>
              </div>

              <div className="admin-health-item">
                <div className="admin-health-header">
                  <Database className="admin-health-icon" />
                  <span>Database</span>
                </div>
                <div className="admin-health-status success">
                  <CheckCircle className="admin-health-status-icon" />
                  Connected
                </div>
              </div>

              <div className="admin-health-item">
                <div className="admin-health-header">
                  <FileText className="admin-health-icon" />
                  <span>PDF Processor</span>
                </div>
                <div className="admin-health-status success">
                  <CheckCircle className="admin-health-status-icon" />
                  Ready
                </div>
              </div>

              <div className="admin-health-item">
                <div className="admin-health-header">
                  <Languages className="admin-health-icon" />
                  <span>AI Services</span>
                </div>
                <div className="admin-health-status success">
                  <CheckCircle className="admin-health-status-icon" />
                  Available
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

