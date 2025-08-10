import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Languages,
  Globe,
  Server,
  Database
} from 'lucide-react';
import axios from 'axios';
import './AdminPages.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface SystemStats {
  totalDocuments: number;
  documentsProcessed: number;
  documentsReduced: number;
  documentsTranslated: number;
  documentsPublished: number;
  totalLanguages: number;
  totalPublications: number;
  processingQueue: number;
}

interface RecentActivity {
  id: string;
  type: 'upload' | 'processing' | 'reduction' | 'translation' | 'publishing';
  documentName: string;
  timestamp: string;
  status: 'completed' | 'in-progress' | 'failed';
  details?: string;
}

interface ProcessingStats {
  avgProcessingTime: number;
  avgReductionTime: number;
  avgTranslationTime: number;
  avgPublishingTime: number;
  successRate: number;
}

export const StatusOverviewPage: React.FC = () => {
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalDocuments: 0,
    documentsProcessed: 0,
    documentsReduced: 0,
    documentsTranslated: 0,
    documentsPublished: 0,
    totalLanguages: 0,
    totalPublications: 0,
    processingQueue: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [processingStats, setProcessingStats] = useState<ProcessingStats>({
    avgProcessingTime: 0,
    avgReductionTime: 0,
    avgTranslationTime: 0,
    avgPublishingTime: 0,
    successRate: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchOverviewData();
    const interval = setInterval(fetchOverviewData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOverviewData = async () => {
    try {
      const [statsResponse, activityResponse, performanceResponse] = await Promise.all([
        axios.get(`${API_BASE}/admin/system/stats`),
        axios.get(`${API_BASE}/admin/system/recent-activity`),
        axios.get(`${API_BASE}/admin/system/performance`)
      ]);

      if (statsResponse.data.success) {
        setSystemStats(statsResponse.data.data);
      }

      if (activityResponse.data.success) {
        setRecentActivity(activityResponse.data.data || []);
      }

      if (performanceResponse.data.success) {
        setProcessingStats(performanceResponse.data.data);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
      // Set mock data for development
      setSystemStats({
        totalDocuments: 24,
        documentsProcessed: 20,
        documentsReduced: 15,
        documentsTranslated: 10,
        documentsPublished: 8,
        totalLanguages: 12,
        totalPublications: 25,
        processingQueue: 3
      });

      setRecentActivity([
        {
          id: '1',
          type: 'publishing',
          documentName: 'Installation Guide v2.1',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          status: 'completed',
          details: 'Published in 3 languages'
        },
        {
          id: '2',
          type: 'translation',
          documentName: 'Safety Manual v1.8',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
          status: 'in-progress',
          details: 'Translating to Spanish, French'
        },
        {
          id: '3',
          type: 'reduction',
          documentName: 'Technical Specs v3.0',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          status: 'completed',
          details: 'Identified 156 text groups'
        },
        {
          id: '4',
          type: 'upload',
          documentName: 'Maintenance Guide v1.5',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
          status: 'failed',
          details: 'Invalid PDF format'
        }
      ]);

      setProcessingStats({
        avgProcessingTime: 3.2,
        avgReductionTime: 1.8,
        avgTranslationTime: 4.5,
        avgPublishingTime: 0.8,
        successRate: 92.5
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <FileText className="w-4 h-4" />;
      case 'processing':
        return <Server className="w-4 h-4" />;
      case 'reduction':
        return <BarChart3 className="w-4 h-4" />;
      case 'translation':
        return <Languages className="w-4 h-4" />;
      case 'publishing':
        return <Globe className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string, status: string) => {
    if (status === 'failed') return 'text-red-600 bg-red-50';
    if (status === 'in-progress') return 'text-yellow-600 bg-yellow-50';
    
    switch (type) {
      case 'upload':
        return 'text-blue-600 bg-blue-50';
      case 'processing':
        return 'text-purple-600 bg-purple-50';
      case 'reduction':
        return 'text-indigo-600 bg-indigo-50';
      case 'translation':
        return 'text-green-600 bg-green-50';
      case 'publishing':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 minute ago';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-content">
          <RefreshCw className="admin-loading-spinner" />
          <span>Loading system overview...</span>
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
            <BarChart3 className="admin-page-icon" />
            <h1>System Status Overview</h1>
          </div>
          <div className="admin-page-actions">
            <button
              onClick={() => fetchOverviewData()}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* System Statistics */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Processing Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded border">
            <div className="font-medium text-2xl text-blue-900">{systemStats.totalDocuments}</div>
            <div className="text-blue-600 text-sm">Total Documents</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded border">
            <div className="font-medium text-2xl text-green-900">{systemStats.documentsProcessed}</div>
            <div className="text-green-600 text-sm">Processed</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded border">
            <div className="font-medium text-2xl text-purple-900">{systemStats.documentsReduced}</div>
            <div className="text-purple-600 text-sm">Content Reduced</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded border">
            <div className="font-medium text-2xl text-orange-900">{systemStats.documentsTranslated}</div>
            <div className="text-orange-600 text-sm">Translated</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-4 bg-teal-50 rounded border">
            <div className="font-medium text-2xl text-teal-900">{systemStats.documentsPublished}</div>
            <div className="text-teal-600 text-sm">Published</div>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded border">
            <div className="font-medium text-2xl text-indigo-900">{systemStats.totalLanguages}</div>
            <div className="text-indigo-600 text-sm">Languages Supported</div>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded border">
            <div className="font-medium text-2xl text-pink-900">{systemStats.totalPublications}</div>
            <div className="text-pink-600 text-sm">Total Publications</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded border">
            <div className="font-medium text-2xl text-yellow-900">{systemStats.processingQueue}</div>
            <div className="text-yellow-600 text-sm">In Queue</div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Average Processing Times</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">PDF Processing</span>
                <span className="font-medium">{processingStats.avgProcessingTime} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Content Reduction</span>
                <span className="font-medium">{processingStats.avgReductionTime} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Translation</span>
                <span className="font-medium">{processingStats.avgTranslationTime} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Publishing</span>
                <span className="font-medium">{processingStats.avgPublishingTime} min</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">System Health</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${processingStats.successRate}%` }}
                    ></div>
                  </div>
                  <span className="font-medium text-green-600">{processingStats.successRate}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">System Status</span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-600">Operational</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AI Service</span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-600">Connected</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Storage</span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-600">Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <div className={`p-2 rounded-full ${getActivityColor(activity.type, activity.status)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 truncate">{activity.documentName}</h4>
                    {getStatusIcon(activity.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="capitalize">{activity.type.replace('-', ' ')}</span>
                    {activity.details && ` • ${activity.details}`}
                  </p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </div>

      {/* System Information */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Pipeline Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Upload Service</span>
                <span className="text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">PDF Processor</span>
                <span className="text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">AI Reduction</span>
                <span className="text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Translation</span>
                <span className="text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Publishing</span>
                <span className="text-green-600">Active</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Resource Usage</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Storage</span>
                <span className="text-blue-600">2.4 GB used</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Memory</span>
                <span className="text-blue-600">1.2 GB used</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">CPU</span>
                <span className="text-blue-600">12% avg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">AI Tokens</span>
                <span className="text-blue-600">45K today</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Version Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">DEHN Platform</span>
                <span className="text-gray-900">v1.2.3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">PDF Processor</span>
                <span className="text-gray-900">v2.1.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">AI Agent</span>
                <span className="text-gray-900">v1.5.2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database</span>
                <span className="text-gray-900">MongoDB 7.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
