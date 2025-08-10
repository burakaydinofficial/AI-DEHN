import { 
  Upload,
  FileSearch, 
  GitBranch, 
  Languages, 
  Globe,
  Activity
} from 'lucide-react';

export const ADMIN_TABS = {
  upload: 'upload',
  processing: 'processing', 
  reduction: 'reduction',
  translation: 'translation',
  publishing: 'publishing',
  status: 'status'
} as const;

export type AdminTabType = typeof ADMIN_TABS[keyof typeof ADMIN_TABS];

export const ADMIN_TAB_CONFIG = [
  { id: ADMIN_TABS.upload, label: 'Upload', icon: Upload },
  { id: ADMIN_TABS.processing, label: 'Processing Status', icon: Activity },
  { id: ADMIN_TABS.reduction, label: 'Content Reduction', icon: GitBranch },
  { id: ADMIN_TABS.translation, label: 'Translation', icon: Languages },
  { id: ADMIN_TABS.publishing, label: 'Publishing', icon: Globe },
  { id: ADMIN_TABS.status, label: 'Overview', icon: FileSearch }
] as const;
