import React from 'react';
import { ADMIN_TAB_CONFIG, AdminTabType } from '../constants/adminTabs';
import { AdminLayoutTab } from './AdminLayoutTab';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: AdminTabType;
  onTabChange: (tab: AdminTabType) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="admin-layout">
      <div className="admin-container">
        {/* Tab Navigation */}
        <nav className="admin-tabs-nav">
          {ADMIN_TAB_CONFIG.map((tab) => (
            <AdminLayoutTab
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              isActive={activeTab === tab.id}
              onClick={onTabChange}
            />
          ))}
        </nav>

        {/* Tab Content */}
        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
};
