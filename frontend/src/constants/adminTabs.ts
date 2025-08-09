import { 
  BarChart3,
  Upload, 
  FileText, 
  Settings, 
  Globe,
  MessageSquare
} from 'lucide-react';

export const ADMIN_TABS = {
  dashboard: 'dashboard',
  ingestion: 'ingestion',
  decomposition: 'decomposition',
  enrichment: 'enrichment',
  publishing: 'publishing',
  feedback: 'feedback'
} as const;

export type AdminTabType = typeof ADMIN_TABS[keyof typeof ADMIN_TABS];

export const ADMIN_TAB_CONFIG = [
  { id: ADMIN_TABS.dashboard, label: 'Dashboard', icon: BarChart3 },
  { id: ADMIN_TABS.ingestion, label: 'Ingestion', icon: Upload },
  { id: ADMIN_TABS.decomposition, label: 'Decomposition', icon: FileText },
  { id: ADMIN_TABS.enrichment, label: 'Enrichment', icon: Settings },
  { id: ADMIN_TABS.publishing, label: 'Publishing', icon: Globe },
  { id: ADMIN_TABS.feedback, label: 'Feedback Loop', icon: MessageSquare }
] as const;
