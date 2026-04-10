import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  getDoc,
  getDocs,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword
} from 'firebase/auth';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { Category, Document as DocType, DocBlock, UserProfile, Template } from '../types';
import { useAuth } from './AuthContext';

// --- Helpers for Firestore (Nested Arrays) ---
export const serializeBlocks = (blocks: DocBlock[]): any[] => {
  return blocks.map(block => {
    if (block.type === 'table' && Array.isArray(block.data)) {
      return { ...block, data: JSON.stringify(block.data) };
    }
    if (block.type === 'tabs' && Array.isArray(block.tabs)) {
      return { ...block, tabs: JSON.stringify(block.tabs) };
    }
    return block;
  });
};

const deserializeBlocks = (blocks: any[]): DocBlock[] => {
  if (!blocks) return [];
  return blocks.map(block => {
    if (block.type === 'table' && typeof block.data === 'string') {
      try {
        return { ...block, data: JSON.parse(block.data) };
      } catch (e) {
        console.error('Failed to parse table data', e);
        return { ...block, data: [['', ''], ['', '']] };
      }
    }
    if (block.type === 'tabs' && typeof block.tabs === 'string') {
      try {
        return { ...block, tabs: JSON.parse(block.tabs) };
      } catch (e) {
        console.error('Failed to parse tabs data', e);
        return { ...block, tabs: [] };
      }
    }
    return block;
  });
};

export interface DocContextType {
  view: string;
  setView: (v: any) => void;
  curCatId: string | null;
  setCurCatId: (id: string | null) => void;
  curDocId: string | null;
  setCurDocId: (id: string | null) => void;
  categories: Category[];
  setCategories: (cats: Category[]) => void;
  documents: DocType[];
  setDocuments: (docs: DocType[]) => void;
  templates: Template[];
  setTemplates: (temps: Template[]) => void;
  showEditor: boolean;
  setShowEditor: (show: boolean) => void;
  editingDoc: DocType | null;
  setEditingDoc: (doc: DocType | null) => void;
  showLogin: boolean;
  setShowLogin: (show: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  loginEmail: string;
  setLoginEmail: (email: string) => void;
  loginPassword: string;
  setLoginPassword: (pass: string) => void;
  regData: any;
  setRegData: (data: any) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  toggleTheme: () => void;
  handleLogin: (e: any) => Promise<void>;
  handleEmailLogin: (e: any) => Promise<void>;
  handleEmailRegister: (e: any) => Promise<void>;
  handleForgotPassword: () => Promise<void>;
  handleLogout: () => void;
  pushRead: (id: string) => void;
  pushEdit: (id: string) => void;
  goDoc: (id: string) => void;
  goCat: (id: string) => void;
  toast: (msg: string) => void;
  readHistory: any[];
  setReadHistory: (h: any[]) => void;
  editHistory: any[];
  setEditHistory: (h: any[]) => void;
  activeTab: string;
  setActiveTab: (t: any) => void;
  filteredDocuments: DocType[];
  handleDeleteDoc: (id: string) => Promise<void>;
  handleCreateDoc: () => void;
  handleCreateCategory: () => void;
  handleDeleteCat: (id: string) => Promise<void>;
  handleDeleteTemplate: (id: string) => Promise<void>;
  handleUpdateProfile: (data: UserProfile) => Promise<void>;
  handleChangePassword: (newPass: string) => Promise<void>;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
}

export const DocContext = createContext<DocContextType | null>(null);

export const useDoc = () => {
  const context = useContext(DocContext);
  if (!context) throw new Error('useDoc must be used within a DocProvider');
  return context;
};

export const DocProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setProfile, isAdmin } = useAuth();
  const [view, setView] = useState<'home' | 'cat' | 'doc' | 'admin' | 'search' | 'profile'>('home');
  const [activeTab, setActiveTab] = useState<'docs' | 'cats' | 'users' | 'templates'>('docs');
  const [curDocId, setCurDocId] = useState<string | null>(null);
  const [curCatId, setCurCatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as any) || 'light');
  const [showEditor, setShowEditor] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocType | null>(null);
  const [readHistory, setReadHistory] = useState<any[]>([]);
  const [editHistory, setEditHistory] = useState<any[]>([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regData, setRegData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    company: '',
    photoURL: ''
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'categories'));

    const unsubDocs = onSnapshot(collection(db, 'documents'), (snap) => {
      setDocuments(snap.docs.map(d => {
        const data = d.data();
        return { 
          ...data, 
          id: d.id, 
          blocks: deserializeBlocks(data.blocks) 
        } as DocType;
      }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'documents'));

    return () => { unsubCats(); unsubDocs(); };
  }, []);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      return;
    }
    const unsubTemplates = onSnapshot(collection(db, 'templates'), (snap) => {
      setTemplates(snap.docs.map(d => {
        const data = d.data();
        return { 
          ...data, 
          id: d.id, 
          blocks: deserializeBlocks(data.blocks) 
        } as Template;
      }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'templates'));

    return unsubTemplates;
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithPopup(auth, googleProvider);
      setShowLogin(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let email = loginEmail;
    let password = loginPassword;

    if (loginEmail.toLowerCase() === 'admin' && loginPassword === '8888') {
      email = 'admin@doctify.com';
      password = 'password8888';
    }

    try {
      if (!email.includes('@')) {
        const snap = await getDocs(collection(db, 'users'));
        const userWithUsername = snap.docs.find(d => d.data().username?.toLowerCase() === email.toLowerCase());
        if (userWithUsername) {
          email = userWithUsername.data().email;
        } else if (email !== 'admin@doctify.com') {
          throw new Error('Username not found');
        }
      }

      await signInWithEmailAndPassword(auth, email, password);
      setShowLogin(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      alert('Login failed: ' + err.message);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const snap = await getDocs(collection(db, 'users'));
      const exists = snap.docs.some(d => d.data().username?.toLowerCase() === regData.username.toLowerCase());
      
      if (exists) {
        alert('Username already taken. Please choose another.');
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, regData.email, regData.password);
      const newProfile: UserProfile = {
        id: cred.user.uid,
        name: regData.name,
        username: regData.username.toLowerCase(),
        email: regData.email,
        company: regData.company,
        photoURL: regData.photoURL,
        role: regData.email === 'karthick.branding@gmail.com' || regData.email === 'admin@doctify.com' ? 'admin' : 'viewer'
      };
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setProfile(newProfile);
      setShowLogin(false);
      toast('Account created successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      alert('Please enter your email address first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginEmail);
      toast('Password reset email sent!');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setView('home');
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const pushRead = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    setReadHistory(prev => {
      const filtered = prev.filter(h => h.id !== docId);
      return [{ id: docId, title: doc.title, categoryId: doc.categoryId, ts: Date.now() }, ...filtered].slice(0, 12);
    });
  };

  const pushEdit = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    setEditHistory(prev => {
      const filtered = prev.filter(h => h.id !== docId);
      return [{ id: docId, title: doc.title, categoryId: doc.categoryId, ts: Date.now() }, ...filtered].slice(0, 12);
    });
  };

  const goDoc = (id: string) => {
    setCurDocId(id);
    setView('doc');
    pushRead(id);
  };

  const goCat = (id: string) => {
    setCurCatId(id);
    setView('cat');
  };

  const handleDeleteDoc = async (id: string) => {
    if (confirm('Delete this document?')) {
      try {
        await deleteDoc(doc(db, 'documents', id));
        if (curDocId === id) {
          setCurDocId(null);
          setView('home');
        }
        toast('Document deleted');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'documents');
      }
    }
  };

  const handleCreateDoc = () => {
    setEditingDoc({
      id: '',
      title: '',
      categoryId: curCatId || '',
      blocks: [
        { id: '1', type: 'heading', content: 'New Document' },
        { id: '2', type: 'text', content: 'Start writing here...' }
      ],
      createdAt: null,
      updatedAt: null,
      authorId: user?.uid || '',
      icon: 'FileText'
    });
    setShowEditor(true);
  };

  const handleCreateCategory = async () => {
    const name = prompt('Enter category name:');
    if (!name) return;
    try {
      const newCatRef = doc(collection(db, 'categories'));
      await setDoc(newCatRef, {
        id: newCatRef.id,
        name,
        description: '',
        icon: 'Folder',
        parentId: curCatId || null,
        authorId: user?.uid || ''
      });
      toast('Category created');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'categories');
    }
  };

  const handleDeleteCat = async (id: string) => {
    if (confirm('Delete this category?')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        toast('Category deleted');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'categories');
      }
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Delete this template?')) {
      try {
        await deleteDoc(doc(db, 'templates', id));
        toast('Template deleted');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'templates');
      }
    }
  };

  const handleUpdateProfile = async (data: UserProfile) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), data as any);
      setProfile(data);
      toast('Profile updated successfully!');
    } catch (err: any) {
      toast('Error: ' + err.message);
    }
  };

  const handleChangePassword = async (newPass: string) => {
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPass);
        toast('Password changed successfully!');
      }
    } catch (err: any) {
      toast('Error: ' + err.message);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const query = searchQuery.toLowerCase();
    const titleMatch = doc.title.toLowerCase().includes(query);
    const contentMatch = doc.blocks.some(block => 
      block.content?.toLowerCase().includes(query) || 
      block.items?.some(item => item.toLowerCase().includes(query))
    );
    return titleMatch || contentMatch;
  });

  return (
    <DocContext.Provider value={{
      view, setView, curCatId, setCurCatId, curDocId, setCurDocId,
      categories, setCategories, documents, setDocuments, templates, setTemplates,
      showEditor, setShowEditor, editingDoc, setEditingDoc, showLogin, setShowLogin,
      authMode, setAuthMode, loginEmail, setLoginEmail, loginPassword, setLoginPassword,
      regData, setRegData, searchQuery, setSearchQuery, theme, setTheme, toggleTheme,
      handleLogin, handleEmailLogin, handleEmailRegister, handleForgotPassword, handleLogout,
      pushRead, pushEdit, goDoc, goCat, toast, readHistory, setReadHistory,
      editHistory, setEditHistory, activeTab, setActiveTab, filteredDocuments, handleDeleteDoc,
      handleCreateDoc, handleCreateCategory, handleDeleteCat, handleDeleteTemplate,
      handleUpdateProfile, handleChangePassword, isDark: theme === 'dark', setIsDark: (v: boolean) => setTheme(v ? 'dark' : 'light')
    }}>
      {children}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900 text-white px-5 py-2.5 rounded-full text-[13px] font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          {toastMsg}
        </div>
      )}
    </DocContext.Provider>
  );
};
