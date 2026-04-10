export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  parentId?: string | null;
  authorId?: string;
}

export interface TabItem {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'code';
  lang?: string;
}

export interface DocBlock {
  id: string;
  type: 'heading' | 'text' | 'code' | 'image' | 'link' | 'list' | 'table' | 'tabs' | 'callout';
  content?: string;
  lang?: string;
  src?: string;
  caption?: string;
  url?: string;
  label?: string;
  items?: string[];
  ordered?: boolean;
  rows?: number;
  cols?: number;
  headers?: string[];
  data?: string[][];
  calloutType?: 'info' | 'success' | 'warning' | 'error' | 'tip';
  tabs?: TabItem[];
}

export interface Document {
  id: string;
  title: string;
  icon?: string;
  coverImage?: string;
  categoryId: string;
  blocks: DocBlock[];
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  authorId: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  company?: string;
  photoURL?: string;
  designation?: string;
  address?: string;
  mobile?: string;
  otherDetails?: string;
  status?: 'active' | 'stopped';
  spaceUsed?: number; // in MB
  bandwidth?: number; // in MB
  isSuperAdmin?: boolean;
  gstNumber?: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  blocks: DocBlock[];
  createdAt?: any;
  updatedAt?: any;
  authorId: string;
}
