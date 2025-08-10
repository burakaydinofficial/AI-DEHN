import React from 'react';
import { AdminTabType } from '../constants/adminTabs';
import './AdminLayout.css';

interface AdminLayoutTabProps {
  id: AdminTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: (tab: AdminTabType) => void;
}

export const AdminLayoutTab: React.FC<AdminLayoutTabProps> = ({ 
  id, 
  label, 
  icon: Icon, 
  isActive, 
  onClick 
}) => {
  return (
    <button
      onClick={() => onClick(id)}
      className={`admin-tab ${isActive ? 'active' : 'inactive'}`}
    >
      <Icon className="admin-tab-icon" />
      {label}
    </button>
  );
};
