import React from 'react';
import { ADMIN_TAB_CONFIG, AdminTabType } from '../constants/adminTabs';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: AdminTabType;
  onTabChange: (tab: AdminTabType) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <nav className="flex flex-wrap gap-2 mb-8 bg-white p-4 rounded-lg shadow-sm border">
          {ADMIN_TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
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
        <main className="bg-white rounded-lg shadow-sm border p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
