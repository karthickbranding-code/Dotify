export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  parentId?: string | null;
}

export interface DocBlock {
  id: string;
  type: 'heading' | 'text' | 'code' | 'image' | 'link' | 'list' | 'table';
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
}

export interface Document {
  id: string;
  title: string;
  categoryId: string;
  blocks: DocBlock[];
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  authorId: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}
