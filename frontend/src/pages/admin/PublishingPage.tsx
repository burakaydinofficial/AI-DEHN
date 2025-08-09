import React, { useState, useEffect } from 'react';
import { 
  Users,
  Monitor,
  Smartphone,
  Headphones,
  FileText,
  Globe,
  Search,
  AlertTriangle,
  Settings,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'http://localhost:3001/api';

interface AudienceType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface OutputFormat {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'active' | 'coming-soon';
}

interface AccessMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface PublishingStatus {
  id: string;
  document: string;
  version: string;
  languages: number;
  channels: string;
  status: 'published' | 'updating' | 'pending';
}

export const PublishingPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const audienceTypes: AudienceType[] = [
    {
      id: 'pro',
      name: 'Pro Installer',
      description: 'Essential steps only',
      icon: <Users className="w-5 h-5 text-green-600" />,
      color: 'green'
    },
    {
      id: 'apprentice',
      name: 'Apprentice',
      description: 'Detailed explanations',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      color: 'blue'
    },
    {
      id: 'inspector',
      name: 'Inspector',
      description: 'Compliance focus',
      icon: <Users className="w-5 h-5 text-purple-600" />,
      color: 'purple'
    }
  ];

  const outputFormats: OutputFormat[] = [
    {
      id: 'web',
      name: 'Web Portal',
      icon: <Monitor className="w-5 h-5" />,
      status: 'active'
    },
    {
      id: 'mobile',
      name: 'Mobile App',
      icon: <Smartphone className="w-5 h-5" />,
      status: 'active'
    },
    {
      id: 'vr',
      name: 'VR Training',
      icon: <Headphones className="w-5 h-5" />,
      status: 'coming-soon'
    },
    {
      id: 'pdf',
      name: 'PDF Export',
      icon: <FileText className="w-5 h-5" />,
      status: 'active'
    }
  ];

  const accessMethods: AccessMethod[] = [
    {
      id: 'part-number',
      name: 'Part Number',
      icon: <Search className="w-5 h-5" />,
      description: 'Search by component'
    },
    {
      id: 'symptom',
      name: 'By Symptom',
      icon: <AlertTriangle className="w-5 h-5" />,
      description: 'Problem-based lookup'
    },
    {
      id: 'job-based',
      name: 'Job-Based',
      icon: <Settings className="w-5 h-5" />,
      description: 'Task-oriented navigation'
    }
  ];

  const mockPublishingStatus: PublishingStatus[] = [
    {
      id: '1',
      document: 'Lightning Protection Manual',
      version: 'v3.1',
      languages: 12,
      channels: 'All Channels',
      status: 'published'
    },
    {
      id: '2',
      document: 'Surge Protector Guide',
      version: 'v2.3',
      languages: 8,
      channels: 'Web + Mobile',
      status: 'updating'
    },
    {
      id: '3',
      document: 'Grounding System Manual',
      version: 'v1.5',
      languages: 6,
      channels: 'Web Only',
      status: 'pending'
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
      setDocuments(docs.filter((d: any) => 
        d.status === 'chunked' || d.status === 'translated' || d.status === 'published'
      ));
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-50 text-green-800';
      case 'updating': return 'bg-yellow-50 text-yellow-800';
      case 'pending': return 'bg-blue-50 text-blue-800';
      default: return 'bg-gray-50 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading publishing data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Multi-Channel Publishing</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Audience Types */}
          <div className="text-center">
            <h4 className="font-medium mb-3">Audience Types</h4>
            <div className="space-y-2">
              {audienceTypes.map((audience) => (
                <div 
                  key={audience.id} 
                  className={`p-3 border rounded-lg bg-${audience.color}-50 hover:bg-${audience.color}-100 transition-colors cursor-pointer`}
                >
                  <div className="flex justify-center mb-1">
                    {audience.icon}
                  </div>
                  <p className="text-sm font-medium">{audience.name}</p>
                  <p className="text-xs text-gray-600">{audience.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Output Formats */}
          <div className="text-center">
            <h4 className="font-medium mb-3">Output Formats</h4>
            <div className="space-y-2">
              {outputFormats.map((format) => (
                <div 
                  key={format.id} 
                  className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                    format.status === 'active' 
                      ? 'hover:bg-gray-50' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    {format.icon}
                  </div>
                  <p className="text-sm font-medium">{format.name}</p>
                  {format.status === 'coming-soon' && (
                    <p className="text-xs text-gray-500">Coming Soon</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Access Methods */}
          <div className="text-center">
            <h4 className="font-medium mb-3">Access Methods</h4>
            <div className="space-y-2">
              {accessMethods.map((method) => (
                <div key={method.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex justify-center mb-1">
                    {method.icon}
                  </div>
                  <p className="text-sm font-medium">{method.name}</p>
                  <p className="text-xs text-gray-600">{method.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Publishing Status */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Live Publishing Status</h4>
          <div className="space-y-2">
            {mockPublishingStatus.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <span className="text-sm font-medium">{item.document} {item.version}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {item.languages} Languages
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {item.channels}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                    {item.status === 'updating' ? (
                      <div className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Updating...
                      </div>
                    ) : (
                      item.status
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document Publishing Controls */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Document Publishing Controls</h3>
        
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{doc.filename}</h4>
                    <p className="text-xs text-gray-600 capitalize">{doc.status}</p>
                  </div>
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span>Audience Coverage:</span>
                    <span className="font-medium">3/3 types</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Output Formats:</span>
                    <span className="font-medium">Web + Mobile</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Languages:</span>
                    <span className="font-medium">1 (EN)</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {doc.status === 'published' ? (
                    <>
                      <button className="flex-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Published
                      </button>
                      <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                        Update
                      </button>
                    </>
                  ) : (
                    <button className="flex-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                      <Globe className="w-3 h-3 inline mr-1" />
                      Publish Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No documents ready for publishing</p>
            <p className="text-sm text-gray-400">Complete the enrichment process first</p>
          </div>
        )}
      </div>

      {/* Publishing Statistics */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Publishing Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded">
            <p className="text-2xl font-bold text-blue-600">{documents.length}</p>
            <p className="text-xs text-blue-600">Ready Documents</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <p className="text-2xl font-bold text-green-600">
              {documents.filter(d => d.status === 'published').length}
            </p>
            <p className="text-xs text-green-600">Published</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded">
            <p className="text-2xl font-bold text-purple-600">3</p>
            <p className="text-xs text-purple-600">Output Channels</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded">
            <p className="text-2xl font-bold text-orange-600">12</p>
            <p className="text-xs text-orange-600">Max Languages</p>
          </div>
        </div>
      </div>
    </div>
  );
};
