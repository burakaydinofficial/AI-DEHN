import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { DashboardPage } from './DashboardPage';
import { IngestionPage } from './IngestionPage';
import { DecompositionPage } from './DecompositionPage';
import { EnrichmentPage } from './EnrichmentPage';
import { PublishingPage } from './PublishingPage';
import { FeedbackPage } from './FeedbackPage';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'ingestion':
        return <IngestionPage />;
      case 'decomposition':
        return <DecompositionPage />;
      case 'enrichment':
        return <EnrichmentPage />;
      case 'publishing':
        return <PublishingPage />;
      case 'feedback':
        return <FeedbackPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};
