import React from 'react';
import { 
  Upload, 
  FileText, 
  Settings, 
  MessageSquare, 
  BarChart3,
  Globe
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'ingestion', label: 'Ingestion', icon: Upload },
    { id: 'decomposition', label: 'Decomposition', icon: FileText },
    { id: 'enrichment', label: 'Enrichment', icon: Settings },
    { id: 'publishing', label: 'Publishing', icon: Globe },
    { id: 'feedback', label: 'Feedback Loop', icon: MessageSquare }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <nav className="flex space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
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

      {/* Tab Content */}
      <main>
        {children}
      </main>
    </div>
  );
};
