export interface Document {
  id: string;
  library: string;
  version: string;
  url: string;
  content: string;
  metadata: {
    title?: string;
    description?: string;
    lastUpdated?: string;
    source?: 'web' | 'github' | 'npm' | 'pypi' | 'local';
  };
  projectId?: string; // For project-specific docs
  createdAt: string;
  updatedAt: string;
}