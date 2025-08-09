import React, { useState, useEffect } from 'react';
import { 
  MessageSquare,
  RefreshCw,
  User,
  Clock,
  TrendingUp,
  ThumbsUp
} from 'lucide-react';

interface UserQuery {
  id: string;
  document: string;
  step: string;
  question: string;
  selectedText?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'ai-responded' | 'escalated' | 'resolved';
  timestamp: string;
  user_id: string;
}

interface ContentImprovement {
  id: string;
  title: string;
  description: string;
  similar_queries: number;
  progress: number;
  status: 'flagged' | 'in-progress' | 'ready' | 'deployed';
  languages: string[];
}

interface AnalyticsData {
  queries_this_week: number;
  ai_resolution_rate: number;
  content_updates: number;
  user_satisfaction: number;
}

export const FeedbackPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'improvements' | 'analytics'>('live');

  const mockUserQueries: UserQuery[] = [
    {
      id: '1',
      document: 'Lightning Rod Type A',
      step: 'Step 4.2',
      question: 'Do I need to tighten this before step 5?',
      selectedText: 'Secure the mounting bracket...',
      priority: 'high',
      status: 'new',
      timestamp: '2025-08-09T10:30:00Z',
      user_id: 'installer_001'
    },
    {
      id: '2',
      document: 'Grounding System',
      step: 'Step 2.1',
      question: 'Image is too blurry to see details',
      priority: 'medium',
      status: 'resolved',
      timestamp: '2025-08-09T09:15:00Z',
      user_id: 'tech_002'
    },
    {
      id: '3',
      document: 'Surge Protector Manual',
      step: 'Step 3.3',
      question: 'What voltage rating do I need for this application?',
      selectedText: 'Select appropriate surge protector...',
      priority: 'critical',
      status: 'escalated',
      timestamp: '2025-08-09T08:45:00Z',
      user_id: 'engineer_003'
    },
    {
      id: '4',
      document: 'Lightning Rod Type A',
      step: 'Step 1.1',
      question: 'Can I use regular tools or do I need insulated ones?',
      priority: 'high',
      status: 'ai-responded',
      timestamp: '2025-08-08T16:20:00Z',
      user_id: 'apprentice_004'
    }
  ];

  const mockImprovements: ContentImprovement[] = [
    {
      id: '1',
      title: 'Torque Specifications Clarification',
      description: '5 similar queries about unclear torque values in mounting procedures',
      similar_queries: 5,
      progress: 75,
      status: 'in-progress',
      languages: ['EN', 'DE', 'FR']
    },
    {
      id: '2',
      title: 'High-Resolution Images Update',
      description: 'Multiple requests for clearer component identification images',
      similar_queries: 8,
      progress: 100,
      status: 'ready',
      languages: ['EN', 'DE', 'FR', 'ES', 'IT']
    },
    {
      id: '3',
      title: 'Safety Warning Enhancement',
      description: 'Critical safety information needs better visibility',
      similar_queries: 3,
      progress: 25,
      status: 'flagged',
      languages: ['EN']
    }
  ];

  const mockAnalytics: AnalyticsData = {
    queries_this_week: 147,
    ai_resolution_rate: 92,
    content_updates: 23,
    user_satisfaction: 4.8
  };

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-red-600 bg-red-100';
      case 'ai-responded': return 'text-blue-600 bg-blue-100';
      case 'escalated': return 'text-orange-600 bg-orange-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImprovementStatusColor = (status: string) => {
    switch (status) {
      case 'flagged': return 'text-red-600 bg-red-100';
      case 'in-progress': return 'text-orange-600 bg-orange-100';
      case 'ready': return 'text-blue-600 bg-blue-100';
      case 'deployed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading feedback data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">In-Context Feedback Loop</h3>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'live', label: 'Live Queries', icon: MessageSquare },
            { id: 'improvements', label: 'Content Improvements', icon: TrendingUp },
            { id: 'analytics', label: 'Analytics', icon: ThumbsUp }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Live Queries Tab */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Live User Queries</h4>
              <button className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200">
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Refresh
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mockUserQueries.map((query) => (
                <div key={query.id} className={`p-4 border rounded-lg ${
                  query.status === 'new' ? 'bg-red-50 border-red-200' :
                  query.status === 'escalated' ? 'bg-orange-50 border-orange-200' :
                  query.status === 'resolved' ? 'bg-green-50 border-green-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-sm">Manual: {query.document}</h5>
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(query.priority)}`}>
                          {query.priority}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(query.status)}`}>
                          {query.status.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {query.step}: "{query.question}"
                      </p>
                      {query.selectedText && (
                        <p className="text-xs text-gray-500 italic">
                          Selected text: "{query.selectedText}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      <span>{query.user_id}</span>
                      <Clock className="w-3 h-3 ml-2" />
                      <span>{formatTimeAgo(query.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {query.status === 'new' && (
                      <>
                        <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                          AI Response
                        </button>
                        <button className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200">
                          Escalate
                        </button>
                      </>
                    )}
                    {query.status === 'ai-responded' && (
                      <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
                        Mark Resolved
                      </button>
                    )}
                    <button className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200">
                      View Context
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Improvements Tab */}
        {activeTab === 'improvements' && (
          <div className="space-y-4">
            <h4 className="font-medium">Content Improvement Pipeline</h4>
            
            <div className="space-y-3">
              {mockImprovements.map((improvement) => (
                <div key={improvement.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{improvement.title}</h5>
                      <p className="text-xs text-gray-600 mb-2">{improvement.description}</p>
                      <p className="text-xs text-blue-600">
                        {improvement.similar_queries} similar queries identified
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getImprovementStatusColor(improvement.status)}`}>
                      {improvement.status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{improvement.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          improvement.progress === 100 ? 'bg-green-500' :
                          improvement.progress >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${improvement.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-gray-600">Languages:</span>
                      {improvement.languages.map((lang) => (
                        <span key={lang} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {lang}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      {improvement.status === 'ready' && (
                        <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
                          Deploy Update
                        </button>
                      )}
                      <button className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h4 className="font-medium">Analytics Dashboard</h4>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{mockAnalytics.queries_this_week}</p>
                <p className="text-xs text-gray-600">Queries This Week</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">+12%</span>
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-green-600">{mockAnalytics.ai_resolution_rate}%</p>
                <p className="text-xs text-gray-600">AI Resolution Rate</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">+5%</span>
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{mockAnalytics.content_updates}</p>
                <p className="text-xs text-gray-600">Content Updates</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">+8%</span>
                </div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{mockAnalytics.user_satisfaction}</p>
                <p className="text-xs text-gray-600">User Satisfaction</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <ThumbsUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">Excellent</span>
                </div>
              </div>
            </div>

            {/* Query Categories */}
            <div>
              <h5 className="font-medium mb-3">Query Categories</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { category: 'Safety Questions', count: 45, color: 'red' },
                  { category: 'Technical Specs', count: 38, color: 'blue' },
                  { category: 'Installation Steps', count: 32, color: 'green' },
                  { category: 'Troubleshooting', count: 32, color: 'orange' }
                ].map((item) => (
                  <div key={item.category} className={`p-3 bg-${item.color}-50 border border-${item.color}-200 rounded-lg`}>
                    <p className={`text-lg font-bold text-${item.color}-600`}>{item.count}</p>
                    <p className="text-xs text-gray-600">{item.category}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Time Metrics */}
            <div>
              <h5 className="font-medium mb-3">Response Performance</h5>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 border rounded-lg text-center">
                  <p className="text-lg font-bold text-green-600">&lt;30s</p>
                  <p className="text-xs text-gray-600">Avg AI Response</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <p className="text-lg font-bold text-blue-600">2.3h</p>
                  <p className="text-xs text-gray-600">Avg Expert Response</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <p className="text-lg font-bold text-purple-600">1.2d</p>
                  <p className="text-xs text-gray-600">Avg Resolution Time</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
