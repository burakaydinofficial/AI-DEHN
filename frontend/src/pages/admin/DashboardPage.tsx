import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface Document {
  id: string;
  filename: string;
  status: 'uploaded' | 'analyzed' | 'reduced' | 'chunked' | 'translated' | 'published';
  uploadedAt: string;
  size: number;
  language?: string;
  safetyFlags?: number;
}

interface FeedbackItem {
  id: string;
  documentName: string;
  step: string;
  issue: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export const DashboardPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeDocuments: 0,
    safetyProcedures: 0,
    pendingUpdates: 0,
    userQueries: 0
  });

  // Mock feedback items for demonstration
  const feedbackItems: FeedbackItem[] = [
    { 
      id: '1', 
      documentName: 'Lightning Rod Installation', 
      step: 'Step 4.2', 
      issue: 'Unclear torque specification', 
      priority: 'high' 
    },
    { 
      id: '2', 
      documentName: 'Surge Protector Manual', 
      step: 'Step 2.1', 
      issue: 'Missing safety warning', 
      priority: 'critical' 
    },
    { 
      id: '3', 
      documentName: 'Grounding System Guide', 
      step: 'Step 6.3', 
      issue: 'Image quality poor', 
      priority: 'medium' 
    }
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/admin/documents`);
      const docs = response.data.data || [];
      setDocuments(docs);
      
      // Calculate stats
      setStats({
        activeDocuments: docs.length,
        safetyProcedures: docs.filter((d: Document) => d.status === 'published').length * 8, // Mock multiplier
        pendingUpdates: docs.filter((d: Document) => d.status === 'analyzed' || d.status === 'reduced').length,
        userQueries: 43 // Mock data
      });
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'bg-blue-100 text-blue-800';
      case 'analyzed': return 'bg-yellow-100 text-yellow-800';
      case 'reduced': return 'bg-purple-100 text-purple-800';
      case 'chunked': return 'bg-orange-100 text-orange-800';
      case 'translated': return 'bg-indigo-100 text-indigo-800';
      case 'published': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      default: return 'bg-blue-100 text-blue-800 border-blue-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold">Active Documents</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.activeDocuments}</p>
          <p className="text-sm text-blue-600">Across multiple languages</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-green-800 font-semibold">Safety Procedures</h3>
          <p className="text-2xl font-bold text-green-900">{stats.safetyProcedures}</p>
          <p className="text-sm text-green-600">All validated</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold">Pending Updates</h3>
          <p className="text-2xl font-bold text-yellow-900">{stats.pendingUpdates}</p>
          <p className="text-sm text-yellow-600">Need review</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-purple-800 font-semibold">User Queries</h3>
          <p className="text-2xl font-bold text-purple-900">{stats.userQueries}</p>
          <p className="text-sm text-purple-600">This week</p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Document Activity */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Document Activity</h3>
          <div className="space-y-3">
            {documents.slice(0, 5).map(document => (
              <div key={document.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium truncate">{document.filename}</h4>
                  <p className="text-sm text-gray-600">
                    {document.language || 'EN'} • Size: {Math.round(document.size / 1024)}KB
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(document.status)}`}>
                  {document.status}
                </span>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No documents uploaded yet</p>
                <p className="text-sm">Upload your first document to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Critical Feedback */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Critical Feedback</h3>
          <div className="space-y-3">
            {feedbackItems.map(item => (
              <div key={item.id} className={`flex items-start gap-3 p-3 border-l-4 bg-red-50 rounded ${getPriorityColor(item.priority)}`}>
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-800">{item.documentName}</h4>
                  <p className="text-sm text-red-600">{item.step}: {item.issue}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                  item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Processing Pipeline Overview */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Processing Pipeline Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { stage: 'Uploaded', count: documents.filter(d => d.status === 'uploaded').length, color: 'blue' },
            { stage: 'Analyzed', count: documents.filter(d => d.status === 'analyzed').length, color: 'yellow' },
            { stage: 'Reduced', count: documents.filter(d => d.status === 'reduced').length, color: 'purple' },
            { stage: 'Chunked', count: documents.filter(d => d.status === 'chunked').length, color: 'orange' },
            { stage: 'Translated', count: documents.filter(d => d.status === 'translated').length, color: 'indigo' },
            { stage: 'Published', count: documents.filter(d => d.status === 'published').length, color: 'green' }
          ].map(({ stage, count, color }) => (
            <div key={stage} className={`text-center p-3 bg-${color}-50 border border-${color}-200 rounded-lg`}>
              <p className={`text-2xl font-bold text-${color}-900`}>{count}</p>
              <p className={`text-sm text-${color}-600`}>{stage}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
