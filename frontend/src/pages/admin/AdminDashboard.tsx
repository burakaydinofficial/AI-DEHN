import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { DashboardPage } from './DashboardPage';
import { IngestionPage } from './IngestionPage';
import { DecompositionPage } from './DecompositionPage';
import { EnrichmentPage } from './EnrichmentPage';
import { PublishingPage } from './PublishingPage';
import { FeedbackPage } from './FeedbackPage';
import { ADMIN_TABS, AdminTabType } from '../../constants/adminTabs';
import '../../admin.css';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTabType>(ADMIN_TABS.dashboard);

  const handleTabChange = (tab: AdminTabType) => {
    setActiveTab(tab);
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
    <AdminLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderContent()}
    </AdminLayout>
  );
};
