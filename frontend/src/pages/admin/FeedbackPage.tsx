import React, { useState, useEffect } from 'react';
import { 
  MessageSquare,
  RefreshCw,
  User,
  Clock,
  TrendingUp,
  ThumbsUp
} from 'lucide-react';
import './FeedbackPage.css';

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
      <div className="feedback-loading">
        <div className="feedback-loading-content">
          <RefreshCw className="feedback-loading-spinner animate-spin" />
          <span className="feedback-loading-text">Loading feedback data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-page">
      <div className="feedback-header">
        <h3 className="feedback-header-title">In-Context Feedback Loop</h3>
        
        {/* Tab Navigation */}
        <div className="feedback-tabs">
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
                className={`feedback-tab ${
                  activeTab === tab.id
                    ? 'feedback-tab-active'
                    : ''
                }`}
              >
                <Icon className="feedback-tab-icon" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Live Queries Tab */}
        {activeTab === 'live' && (
          <div className="live-queries-section">
            <div className="live-queries-header">
              <h4 className="live-queries-title">Live User Queries</h4>
              <button className="refresh-btn">
                <RefreshCw className="refresh-btn-icon" />
                Refresh
              </button>
            </div>
            
            <div className="query-list">
              {mockUserQueries.map((query) => (
                <div key={query.id} className={`query-item ${
                  query.status === 'new' ? 'query-item-new' :
                  query.status === 'escalated' ? 'query-item-escalated' :
                  query.status === 'resolved' ? 'query-item-resolved' :
                  'query-item-responded'
                }`}>
                  <div className="query-item-header">
                    <div className="query-item-left">
                      <div className="query-item-title">
                        <h5 className="query-item-document">Manual: {query.document}</h5>
                        <span className={`priority-badge priority-${query.priority}`}>
                          {query.priority}
                        </span>
                        <span className={`query-status-badge status-${query.status.replace('-', '-')}`}>
                          {query.status.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="query-item-question">
                        {query.step}: "{query.question}"
                      </p>
                      {query.selectedText && (
                        <p className="query-item-selected-text">
                          Selected text: "{query.selectedText}"
                        </p>
                      )}
                    </div>
                    <div className="query-item-meta">
                      <User className="query-item-meta-icon" />
                      <span>{query.user_id}</span>
                      <Clock className="query-item-meta-icon" />
                      <span>{formatTimeAgo(query.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div className="query-actions">
                    <div className="query-actions-row">
                      {query.status === 'new' && (
                        <>
                          <button className="query-action-btn query-action-btn-blue">
                            AI Response
                          </button>
                          <button className="query-action-btn query-action-btn-orange">
                            Escalate
                          </button>
                        </>
                      )}
                      {query.status === 'ai-responded' && (
                        <button className="query-action-btn query-action-btn-green">
                          Mark Resolved
                        </button>
                      )}
                      <button className="query-action-btn query-action-btn-gray">
                        View Context
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Improvements Tab */}
        {activeTab === 'improvements' && (
          <div className="improvements-section">
            <h4 className="improvements-title">Content Improvement Pipeline</h4>
            
            <div className="improvements-list">
              {mockImprovements.map((improvement) => (
                <div key={improvement.id} className="improvement-item">
                  <div className="improvement-header">
                    <div className="improvement-left">
                      <h5 className="improvement-title">{improvement.title}</h5>
                      <p className="improvement-description">{improvement.description}</p>
                      <p className="improvement-similar">
                        {improvement.similar_queries} similar queries identified
                      </p>
                    </div>
                    <span className={`improvement-status-badge status-${improvement.status.replace('-', '-')}`}>
                      {improvement.status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <div className="improvement-progress">
                    <div className="improvement-progress-header">
                      <span className="improvement-progress-label">Progress</span>
                      <span className="improvement-progress-value">{improvement.progress}%</span>
                    </div>
                    <div className="improvement-progress-bar">
                      <div 
                        className={`improvement-progress-fill ${
                          improvement.progress === 100 ? 'bg-green-500' :
                          improvement.progress >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${improvement.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="improvement-actions">
                    <div className="improvement-languages">
                      <span className="improvement-language">Languages:</span>
                      {improvement.languages.map((lang) => (
                        <span key={lang} className="query-action-btn query-action-btn-blue">
                          {lang}
                        </span>
                      ))}
                    </div>
                    
                    <div className="improvement-buttons">
                      {improvement.status === 'ready' && (
                        <button className="query-action-btn query-action-btn-green">
                          Deploy Update
                        </button>
                      )}
                      <button className="query-action-btn query-action-btn-gray">
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
          <div className="analytics-section">
            <h4 className="analytics-title">Analytics Dashboard</h4>
            
            {/* Key Metrics */}
            <div className="analytics-grid">
              <div className="analytics-card">
                <p className="analytics-value">{mockAnalytics.queries_this_week}</p>
                <p className="analytics-label">Queries This Week</p>
                <div className="analytics-trend">
                  <TrendingUp className="analytics-trend-icon" />
                  <span className="analytics-trend-value">+12%</span>
                </div>
              </div>
              <div className="analytics-card">
                <p className="analytics-value analytics-value-green">{mockAnalytics.ai_resolution_rate}%</p>
                <p className="analytics-label">AI Resolution Rate</p>
                <div className="analytics-trend">
                  <TrendingUp className="analytics-trend-icon" />
                  <span className="analytics-trend-value">+5%</span>
                </div>
              </div>
              <div className="analytics-card">
                <p className="analytics-value analytics-value-orange">{mockAnalytics.content_updates}</p>
                <p className="analytics-label">Content Updates</p>
                <div className="analytics-trend">
                  <TrendingUp className="analytics-trend-icon" />
                  <span className="analytics-trend-value">+8%</span>
                </div>
              </div>
              <div className="analytics-card">
                <p className="analytics-value analytics-value-purple">{mockAnalytics.user_satisfaction}</p>
                <p className="analytics-label">User Satisfaction</p>
                <div className="analytics-trend">
                  <ThumbsUp className="analytics-trend-icon" />
                  <span className="analytics-trend-value">Excellent</span>
                </div>
              </div>
            </div>

            {/* Query Categories */}
            <div className="categories-section">
              <h5 className="categories-title">Query Categories</h5>
              <div className="categories-grid">
                {[
                  { category: 'Safety Questions', count: 45, color: 'red' },
                  { category: 'Technical Specs', count: 38, color: 'blue' },
                  { category: 'Installation Steps', count: 32, color: 'green' },
                  { category: 'Troubleshooting', count: 32, color: 'orange' }
                ].map((item) => (
                  <div key={item.category} className="category-item">
                    <p className={`category-count analytics-value-${item.color}`}>{item.count}</p>
                    <p className="category-label">{item.category}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Time Metrics */}
            <div className="performance-section">
              <h5 className="performance-title">Response Performance</h5>
              <div className="performance-grid">
                <div className="performance-item">
                  <p className="performance-value performance-value-green">&lt;30s</p>
                  <p className="performance-label">Avg AI Response</p>
                </div>
                <div className="performance-item">
                  <p className="performance-value performance-value-blue">2.3h</p>
                  <p className="performance-label">Avg Expert Response</p>
                </div>
                <div className="performance-item">
                  <p className="performance-value performance-value-purple">1.2d</p>
                  <p className="performance-label">Avg Resolution Time</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
