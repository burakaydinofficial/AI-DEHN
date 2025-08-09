import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { DashboardPage } from './DashboardPage';
import { IngestionPage } from './IngestionPage';
import { DecompositionPage } from './DecompositionPage';
import { EnrichmentPage } from './EnrichmentPage';
import { PublishingPage } from './PublishingPage';
import { FeedbackPage } from './FeedbackPage';
import '../../admin.css';

const ADMIN_TABS = {
  dashboard: 'dashboard',
  ingestion: 'ingestion',
  decomposition: 'decomposition',
  enrichment: 'enrichment',
  publishing: 'publishing',
  feedback: 'feedback'
} as const;

type AdminTabType = typeof ADMIN_TABS[keyof typeof ADMIN_TABS];

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTabType>(ADMIN_TABS.dashboard);

  const handleTabChange = (tab: string) => {
    if (Object.values(ADMIN_TABS).includes(tab as AdminTabType)) {
      setActiveTab(tab as AdminTabType);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case ADMIN_TABS.dashboard:
        return <DashboardPage />;
      case ADMIN_TABS.ingestion:
        return <IngestionPage />;
      case ADMIN_TABS.decomposition:
        return <DecompositionPage />;
      case ADMIN_TABS.enrichment:
        return <EnrichmentPage />;
      case ADMIN_TABS.publishing:
        return <PublishingPage />;
      case ADMIN_TABS.feedback:
        return <FeedbackPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="admin-container">
      <AdminLayout activeTab={activeTab} onTabChange={handleTabChange}>
        {renderContent()}
      </AdminLayout>
    </div>
  );
};
