import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { UploadPage } from './UploadPage';
import { ProcessingStatusPage } from './ProcessingStatusPage';
import { ContentReductionPage } from './ContentReductionPage';
import { TranslationPage } from './TranslationPage';
import { ProductsPage } from './ProductsPage';
import { PublishingPage } from './PublishingPage';
import { InventoryPage } from './InventoryPage';
import { StatusOverviewPage } from './StatusOverviewPage';
import { ADMIN_TABS, AdminTabType } from '../../constants/adminTabs';
import './AdminPages.css';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTabType>(ADMIN_TABS.upload);

  const handleTabChange = (tab: AdminTabType) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case ADMIN_TABS.upload:
        return <UploadPage />;
      case ADMIN_TABS.processing:
        return <ProcessingStatusPage />;
      case ADMIN_TABS.reduction:
        return <ContentReductionPage />;
      case ADMIN_TABS.translation:
        return <TranslationPage />;
      case ADMIN_TABS.products:
        return <ProductsPage />;
      case ADMIN_TABS.publishing:
        return <PublishingPage />;
      case ADMIN_TABS.inventory:
        return <InventoryPage />;
      case ADMIN_TABS.status:
        return <StatusOverviewPage />;
      default:
        return <UploadPage />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderContent()}
    </AdminLayout>
  );
};
