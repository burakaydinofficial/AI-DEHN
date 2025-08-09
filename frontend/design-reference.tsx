import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Search, 
  Settings, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Edit3, 
  Link, 
  Globe, 
  Smartphone, 
  Monitor,
  Headphones,
  ChevronRight,
  Plus,
  Filter,
  Bell,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const ManualLifecyclePlatform = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedManual, setSelectedManual] = useState(null);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'ingestion', label: 'Ingestion', icon: Upload },
    { id: 'decomposition', label: 'Decomposition', icon: FileText },
    { id: 'enrichment', label: 'Enrichment', icon: Settings },
    { id: 'publishing', label: 'Publishing', icon: Globe },
    { id: 'feedback', label: 'Feedback Loop', icon: MessageSquare }
  ];

  const manuals = [
    { id: 1, name: 'Lightning Rod Installation Type A', status: 'published', languages: 12, versions: 3, safety_flags: 15 },
    { id: 2, name: 'Surge Protector Maintenance', status: 'review', languages: 8, versions: 2, safety_flags: 8 },
    { id: 3, name: 'Grounding System Setup', status: 'draft', languages: 5, versions: 1, safety_flags: 22 }
  ];

  const feedbackItems = [
    { id: 1, manual: 'Lightning Rod Type A', step: 'Step 4.2', issue: 'Unclear torque specification', priority: 'high' },
    { id: 2, manual: 'Surge Protector', step: 'Step 2.1', issue: 'Missing safety warning', priority: 'critical' },
    { id: 3, manual: 'Grounding System', step: 'Step 6.3', issue: 'Image quality poor', priority: 'medium' }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold">Active Manuals</h3>
          <p className="text-2xl font-bold text-blue-900">24</p>
          <p className="text-sm text-blue-600">Across 15 languages</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-green-800 font-semibold">Safety Procedures</h3>
          <p className="text-2xl font-bold text-green-900">156</p>
          <p className="text-sm text-green-600">All validated</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold">Pending Updates</h3>
          <p className="text-2xl font-bold text-yellow-900">7</p>
          <p className="text-sm text-yellow-600">Need review</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-purple-800 font-semibold">User Queries</h3>
          <p className="text-2xl font-bold text-purple-900">43</p>
          <p className="text-sm text-purple-600">This week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Manual Activity</h3>
          <div className="space-y-3">
            {manuals.map(manual => (
              <div key={manual.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">{manual.name}</h4>
                  <p className="text-sm text-gray-600">{manual.languages} languages • {manual.safety_flags} safety flags</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  manual.status === 'published' ? 'bg-green-100 text-green-800' :
                  manual.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {manual.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Critical Feedback</h3>
          <div className="space-y-3">
            {feedbackItems.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-3 border-l-4 border-red-400 bg-red-50 rounded">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-800">{item.manual}</h4>
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
    </div>
  );

  const renderIngestion = () => (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Content Ingestion</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium">PDF Manuals</p>
            <p className="text-sm text-gray-600">Drag & drop or browse</p>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
            <Settings className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium">CAD Files</p>
            <p className="text-sm text-gray-600">Technical drawings</p>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
            <Globe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium">Translations</p>
            <p className="text-sm text-gray-600">Existing multilingual content</p>
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Recent Uploads</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <span className="text-sm">lightning_protection_v3.pdf</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
              <span className="text-sm">surge_protector_cad.dwg</span>
              <div className="w-16 bg-blue-200 rounded-full h-2">
                <div className="w-3/4 bg-blue-500 h-2 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDecomposition = () => (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Semantic Decomposition</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Manual Structure</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                <ChevronRight className="w-4 h-4" />
                <span className="text-sm">1. Safety Overview</span>
                <span className="ml-auto text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Critical</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded ml-4">
                <ChevronRight className="w-4 h-4" />
                <span className="text-sm">1.1 Personal Protective Equipment</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded ml-4">
                <ChevronRight className="w-4 h-4" />
                <span className="text-sm">1.2 Electrical Hazards</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                <ChevronRight className="w-4 h-4" />
                <span className="text-sm">2. Installation Steps</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded ml-4">
                <ChevronRight className="w-4 h-4" />
                <span className="text-sm">2.1 Site Preparation</span>
                <Link className="w-3 h-3 ml-auto text-blue-500" />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Linked Components</h4>
            <div className="space-y-2">
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium text-sm">Ground Rod Assembly</h5>
                <p className="text-xs text-gray-600">Used in 3 other manuals</p>
                <div className="flex gap-1 mt-1">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Shared</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Updated</span>
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium text-sm">Torque Specifications</h5>
                <p className="text-xs text-gray-600">Standard procedure</p>
                <div className="flex gap-1 mt-1">
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Template</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnrichment = () => (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Content Enrichment</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Safety Flagging</h4>
            <div className="space-y-3">
              <div className="p-3 border-l-4 border-red-500 bg-red-50 rounded">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-800">Electrical Hazard</span>
                </div>
                <p className="text-sm text-red-700 mt-1">Step 3.2: High voltage present during testing</p>
              </div>
              <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50 rounded">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Equipment Required</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">Step 2.1: Insulated tools mandatory</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Component Linking</h4>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg bg-blue-50">
                <h5 className="font-medium">Part #LR-2024-A</h5>
                <p className="text-sm text-gray-600">Lightning Rod Assembly</p>
                <div className="flex gap-2 mt-2">
                  <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                    View Specs
                  </button>
                  <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
                    Related Manuals
                  </button>
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium">Part #GR-508-B</h5>
                <p className="text-sm text-gray-600">Grounding Clamp</p>
                <div className="flex gap-2 mt-2">
                  <button className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200">
                    View Specs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPublishing = () => (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Multi-Channel Publishing</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <h4 className="font-medium mb-3">Audience Types</h4>
            <div className="space-y-2">
              <div className="p-3 border rounded-lg bg-green-50">
                <Users className="w-5 h-5 mx-auto mb-1 text-green-600" />
                <p className="text-sm font-medium">Pro Installer</p>
                <p className="text-xs text-gray-600">Essential steps only</p>
              </div>
              <div className="p-3 border rounded-lg bg-blue-50">
                <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                <p className="text-sm font-medium">Apprentice</p>
                <p className="text-xs text-gray-600">Detailed explanations</p>
              </div>
              <div className="p-3 border rounded-lg bg-purple-50">
                <Users className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                <p className="text-sm font-medium">Inspector</p>
                <p className="text-xs text-gray-600">Compliance focus</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="font-medium mb-3">Output Formats</h4>
            <div className="space-y-2">
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <Monitor className="w-5 h-5 mx-auto mb-1" />
                <p className="text-sm font-medium">Web Portal</p>
              </div>
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <Smartphone className="w-5 h-5 mx-auto mb-1" />
                <p className="text-sm font-medium">Mobile App</p>
              </div>
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <Headphones className="w-5 h-5 mx-auto mb-1" />
                <p className="text-sm font-medium">VR Training</p>
              </div>
              <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <FileText className="w-5 h-5 mx-auto mb-1" />
                <p className="text-sm font-medium">PDF Export</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="font-medium mb-3">Access Methods</h4>
            <div className="space-y-2">
              <div className="p-3 border rounded-lg">
                <Search className="w-5 h-5 mx-auto mb-1" />
                <p className="text-sm font-medium">Part Number</p>
              </div>
              <div className="p-3 border rounded-lg">
                <AlertTriangle className="w-5 h-5 mx-auto mb-1" />
                <p className="text-sm font-medium">By Symptom</p>
              </div>
              <div className="p-3 border rounded-lg">
                <Settings className="w-5 h-5 mx-auto mb-1" />
                <p className="text-sm font-medium">Job-Based</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Live Publishing Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <span className="text-sm">Lightning Protection Manual v3.1</span>
              <div className="flex gap-2">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">12 Languages</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">All Channels</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
              <span className="text-sm">Surge Protector Guide v2.3</span>
              <div className="flex gap-2">
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Updating...</span>
                <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeedback = () => (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">In-Context Feedback Loop</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-medium mb-3">Live User Queries</h4>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg bg-red-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">Manual: Lightning Rod Type A</h5>
                    <p className="text-sm text-gray-600">Step 4.2: "Do I need to tighten this before step 5?"</p>
                    <p className="text-xs text-gray-500 mt-1">Selected text: "Secure the mounting bracket..."</p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">New</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                    AI Response
                  </button>
                  <button className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
                    Escalate
                  </button>
                </div>
              </div>
              
              <div className="p-3 border rounded-lg bg-green-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">Manual: Grounding System</h5>
                    <p className="text-sm text-gray-600">Step 2.1: "Image is too blurry to see details"</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Resolved</span>
                </div>
                <p className="text-xs text-green-600 mt-1">Updated with high-res image</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Content Improvement Pipeline</h4>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium text-sm">Flagged for Revision</h5>
                <p className="text-xs text-gray-600 mb-2">5 similar queries about torque specs</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full w-3/4"></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Content update in progress</p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium text-sm">Auto-Translation Ready</h5>
                <p className="text-xs text-gray-600 mb-2">Safety clarification approved</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">DE</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">FR</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">ES</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">+9 more</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Analytics Dashboard</h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">147</p>
              <p className="text-xs text-gray-600">Queries This Week</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">92%</p>
              <p className="text-xs text-gray-600">AI Resolution Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">23</p>
              <p className="text-xs text-gray-600">Content Updates</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">4.8</p>
              <p className="text-xs text-gray-600">User Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'ingestion': return renderIngestion();
      case 'decomposition': return renderDecomposition();
      case 'enrichment': return renderEnrichment();
      case 'publishing': return renderPublishing();
      case 'feedback': return renderFeedback();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Manual Lifecycle Platform</h1>
                <p className="text-sm text-gray-600">Dehn Lightning Protection Systems</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex space-x-1 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
        </nav>

        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default ManualLifecyclePlatform;