import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { 
  Book, 
  FileText, 
  Layers, 
  Zap, 
  Code, 
  Shield, 
  Settings, 
  Plus, 
  Edit, 
  Trash, 
  ChevronRight, 
  LogOut, 
  User as UserIcon,
  Sun,
  Moon,
  Search,
  Home,
  Folder,
  Link as LinkIcon,
  Image as ImageIcon,
  List as ListIcon,
  Check,
  X,
  Copy,
  Clock,
  Menu,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { Category, Document as DocType, DocBlock, UserProfile } from './types';

// --- Context ---
interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isEditor: false,
});

const useAuth = () => useContext(AuthContext);

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, type = 'button' }: any) => {
  const base = "inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-lg";
  const variants: any = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
    outline: "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
  };
  const sizes: any = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1">
    {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <input 
      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
      {...props}
    />
  </div>
);

const Badge = ({ children, variant = 'blue' }: any) => {
  const variants: any = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as any) || 'light');
  const [view, setView] = useState<'home' | 'cat' | 'doc' | 'admin'>('home');
  const [curDocId, setCurDocId] = useState<string | null>(null);
  const [curCatId, setCurCatId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          // Create default profile for new users
          const newProfile: UserProfile = {
            id: u.uid,
            name: u.displayName || u.email?.split('@')[0] || 'User',
            email: u.email || '',
            role: u.email === 'karthick.branding@gmail.com' ? 'admin' : 'viewer'
          };
          await setDoc(doc(db, 'users', u.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'categories'));

    const unsubDocs = onSnapshot(collection(db, 'documents'), (snap) => {
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocType)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'documents'));

    return () => { unsubCats(); unsubDocs(); };
  }, []);

  const isAdmin = profile?.role === 'admin';
  const isEditor = profile?.role === 'editor' || isAdmin;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithPopup(auth, googleProvider);
      setShowLogin(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => signOut(auth);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // --- Views ---

  const HomeView = () => {
    const topCats = categories.filter(c => !c.parentId);
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Documentation</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Everything you need to know about our platform.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topCats.map(cat => (
            <motion.div 
              key={cat.id}
              whileHover={{ y: -4 }}
              onClick={() => { setCurCatId(cat.id); setView('cat'); }}
              className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center mb-4">
                <Folder size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{cat.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{cat.description || 'Explore guides and references.'}</p>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="blue">{documents.filter(d => d.categoryId === cat.id).length} docs</Badge>
                {categories.some(c => c.parentId === cat.id) && <Badge variant="gray">Subtopics</Badge>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const CatView = () => {
    const cat = categories.find(c => c.id === curCatId);
    if (!cat) return null;
    const subCats = categories.filter(c => c.parentId === cat.id);
    const catDocs = documents.filter(d => d.categoryId === cat.id);
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => setView('home')} className="hover:text-blue-600">Home</button>
          <ChevronRight size={14} />
          <span className="text-gray-900 dark:text-white font-medium">{cat.name}</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{cat.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{cat.description}</p>
        </div>
        
        {subCats.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Subtopics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subCats.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setCurCatId(s.id)}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-4 cursor-pointer hover:border-blue-500 transition-all"
                >
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                    <Folder size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium">{s.name}</h4>
                    <p className="text-xs text-gray-500">{documents.filter(d => d.categoryId === s.id).length} docs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Documents</h2>
          <div className="space-y-2">
            {catDocs.map(d => (
              <div 
                key={d.id} 
                onClick={() => { setCurDocId(d.id); setView('doc'); }}
                className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-gray-400" />
                  <span className="font-medium">{d.title}</span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            ))}
            {catDocs.length === 0 && <p className="text-gray-500 italic">No documents found in this category.</p>}
          </div>
        </div>
      </div>
    );
  };

  const DocView = () => {
    const doc = documents.find(d => d.id === curDocId);
    if (!doc) return null;
    const cat = categories.find(c => c.id === doc.categoryId);
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => setView('home')} className="hover:text-blue-600">Home</button>
          <ChevronRight size={14} />
          {cat && (
            <>
              <button onClick={() => { setCurCatId(cat.id); setView('cat'); }} className="hover:text-blue-600">{cat.name}</button>
              <ChevronRight size={14} />
            </>
          )}
          <span className="text-gray-900 dark:text-white font-medium truncate">{doc.title}</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{doc.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Updated {doc.updatedAt?.toDate().toLocaleDateString()}</span>
              {isEditor && (
                <button onClick={() => { setCurDocId(doc.id); setView('admin'); }} className="text-blue-600 hover:underline flex items-center gap-1">
                  <Edit size={14} /> Edit
                </button>
              )}
            </div>
          </div>

          <div className="prose prose-blue dark:prose-invert max-w-none space-y-6">
            {doc.blocks.map(block => (
              <div key={block.id}>
                {block.type === 'heading' && <h2 className="text-2xl font-bold mt-8 mb-4 border-b pb-2">{block.content}</h2>}
                {block.type === 'text' && <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">{block.content}</p>}
                {block.type === 'code' && (
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="flex justify-between mb-2 text-xs text-gray-500 uppercase">
                      <span>{block.lang}</span>
                      <button onClick={() => navigator.clipboard.writeText(block.content || '')} className="hover:text-white">Copy</button>
                    </div>
                    <pre><code>{block.content}</code></pre>
                  </div>
                )}
                {block.type === 'image' && (
                  <figure className="my-6">
                    <img src={block.src} alt={block.caption} className="rounded-xl border dark:border-gray-700 w-full" />
                    {block.caption && <figcaption className="text-center text-sm text-gray-500 mt-2 italic">{block.caption}</figcaption>}
                  </figure>
                )}
                {block.type === 'link' && (
                  <a href={block.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl hover:bg-blue-100 transition-all">
                    <LinkIcon className="text-blue-600" />
                    <div>
                      <div className="font-semibold text-blue-900 dark:text-blue-100">{block.label || block.url}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-md">{block.url}</div>
                    </div>
                  </a>
                )}
                {block.type === 'list' && (
                  <ul className={`${block.ordered ? 'list-decimal' : 'list-disc'} pl-6 space-y-2`}>
                    {block.items?.map((item, i) => <li key={i} className="text-gray-700 dark:text-gray-300">{item}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const AdminView = () => {
    const [activeTab, setActiveTab] = useState<'docs' | 'cats'>('docs');
    const [editingDoc, setEditingDoc] = useState<DocType | null>(null);
    const [editingCat, setEditingCat] = useState<Category | null>(null);

    const handleSaveDoc = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingDoc) return;
      try {
        const docData = {
          ...editingDoc,
          updatedAt: Timestamp.now(),
          createdAt: editingDoc.createdAt || Timestamp.now(),
          authorId: user?.uid || 'anonymous'
        };
        if (editingDoc.id) {
          await updateDoc(doc(db, 'documents', editingDoc.id), docData);
        } else {
          const newDocRef = doc(collection(db, 'documents'));
          await setDoc(newDocRef, { ...docData, id: newDocRef.id });
        }
        setEditingDoc(null);
        toast('Document saved successfully!');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'documents');
      }
    };

    const handleSaveCat = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingCat) return;
      try {
        if (editingCat.id) {
          await updateDoc(doc(db, 'categories', editingCat.id), editingCat as any);
        } else {
          const newCatRef = doc(collection(db, 'categories'));
          await setDoc(newCatRef, { ...editingCat, id: newCatRef.id });
        }
        setEditingCat(null);
        toast('Category saved successfully!');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'categories');
      }
    };

    const handleDeleteDoc = async (id: string) => {
      if (confirm('Delete this document?')) {
        await deleteDoc(doc(db, 'documents', id));
      }
    };

    const handleDeleteCat = async (id: string) => {
      if (confirm('Delete this category?')) {
        await deleteDoc(doc(db, 'categories', id));
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex gap-2">
            <Button variant={activeTab === 'docs' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('docs')}>Documents</Button>
            <Button variant={activeTab === 'cats' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('cats')}>Categories</Button>
          </div>
        </div>

        {activeTab === 'docs' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setEditingDoc({ id: '', title: '', categoryId: '', blocks: [], createdAt: null, updatedAt: null, authorId: '' })}>
                <Plus size={16} /> New Document
              </Button>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {documents.map(d => (
                    <tr key={d.id}>
                      <td className="px-6 py-4 font-medium">{d.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{categories.find(c => c.id === d.categoryId)?.name || 'None'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingDoc(d)}><Edit size={14} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteDoc(d.id)} className="text-red-600"><Trash size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setEditingCat({ id: '', name: '', description: '', parentId: null })}>
                <Plus size={16} /> New Category
              </Button>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {categories.map(c => (
                    <tr key={c.id}>
                      <td className="px-6 py-4 font-medium">{c.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{c.description}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingCat(c)}><Edit size={14} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCat(c.id)} className="text-red-600"><Trash size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modals */}
        <AnimatePresence>
          {editingDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-height-[90vh] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-xl font-bold">{editingDoc.id ? 'Edit Document' : 'New Document'}</h2>
                  <button onClick={() => setEditingDoc(null)}><X /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <Input label="Title" value={editingDoc.title} onChange={(e: any) => setEditingDoc({ ...editingDoc, title: e.target.value })} />
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Category</label>
                    <select 
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                      value={editingDoc.categoryId}
                      onChange={(e) => setEditingDoc({ ...editingDoc, categoryId: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Blocks</h3>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingDoc({ ...editingDoc, blocks: [...editingDoc.blocks, { id: Date.now().toString(), type: 'text', content: '' }] })}>+ Text</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingDoc({ ...editingDoc, blocks: [...editingDoc.blocks, { id: Date.now().toString(), type: 'heading', content: '' }] })}>+ Heading</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingDoc({ ...editingDoc, blocks: [...editingDoc.blocks, { id: Date.now().toString(), type: 'code', content: '', lang: 'javascript' }] })}>+ Code</Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {editingDoc.blocks.map((block, idx) => (
                        <div key={block.id} className="p-4 border dark:border-gray-700 rounded-xl relative group">
                          <button 
                            className="absolute -right-2 -top-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            onClick={() => {
                              const newBlocks = [...editingDoc.blocks];
                              newBlocks.splice(idx, 1);
                              setEditingDoc({ ...editingDoc, blocks: newBlocks });
                            }}
                          >
                            <X size={14} />
                          </button>
                          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase">
                            {block.type === 'text' && <FileText size={12} />}
                            {block.type === 'heading' && <Layers size={12} />}
                            {block.type === 'code' && <Code size={12} />}
                            {block.type}
                          </div>
                          {block.type === 'code' && (
                            <input 
                              className="w-full mb-2 px-2 py-1 text-xs border rounded"
                              value={block.lang}
                              onChange={(e) => {
                                const newBlocks = [...editingDoc.blocks];
                                newBlocks[idx].lang = e.target.value;
                                setEditingDoc({ ...editingDoc, blocks: newBlocks });
                              }}
                              placeholder="Language (e.g. javascript)"
                            />
                          )}
                          <textarea 
                            className="w-full p-2 bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 rounded outline-none min-h-[100px]"
                            value={block.content}
                            onChange={(e) => {
                              const newBlocks = [...editingDoc.blocks];
                              newBlocks[idx].content = e.target.value;
                              setEditingDoc({ ...editingDoc, blocks: newBlocks });
                            }}
                            placeholder="Content..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setEditingDoc(null)}>Cancel</Button>
                  <Button onClick={handleSaveDoc}>Save Document</Button>
                </div>
              </motion.div>
            </div>
          )}

          {editingCat && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6"
              >
                <h2 className="text-xl font-bold">{editingCat.id ? 'Edit Category' : 'New Category'}</h2>
                <Input label="Name" value={editingCat.name} onChange={(e: any) => setEditingCat({ ...editingCat, name: e.target.value })} />
                <div className="space-y-1">
                  <label className="text-sm font-medium">Description</label>
                  <textarea 
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                    value={editingCat.description}
                    onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setEditingCat(null)}>Cancel</Button>
                  <Button onClick={handleSaveCat}>Save Category</Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const toast = (msg: string) => {
    // Simple toast implementation
    alert(msg);
  };

  if (loading) return (
    <div className="min-height-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isEditor }}>
      <div className="min-height-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        {/* Navigation */}
        <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <Book size={18} />
                </div>
                <span className="text-xl font-bold tracking-tight">Doctify</span>
              </div>
              <div className="hidden md:flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setView('home')}>Home</Button>
                {isAdmin && <Button variant="ghost" size="sm" onClick={() => setView('admin')}>Admin</Button>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-semibold">{profile?.name}</div>
                    <div className="text-xs text-gray-500 uppercase">{profile?.role}</div>
                  </div>
                  <button onClick={handleLogout} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-full transition-all">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setShowLogin(true)}>Sign In</Button>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={view + (curDocId || '') + (curCatId || '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'home' && <HomeView />}
              {view === 'cat' && <CatView />}
              {view === 'doc' && <DocView />}
              {view === 'admin' && <AdminView />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Login Modal */}
        <AnimatePresence>
          {showLogin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mx-auto">
                    <Book size={24} />
                  </div>
                  <h2 className="text-2xl font-bold">Welcome to Doctify</h2>
                  <p className="text-gray-500">Sign in to manage documentation</p>
                </div>
                <Button variant="outline" className="w-full py-3" onClick={handleLogin}>
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                  Continue with Google
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-800 px-2 text-gray-500">Or admin login</span></div>
                </div>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <Input label="Email" placeholder="admin@example.com" />
                  <Input label="Password" type="password" placeholder="••••••••" />
                  <Button className="w-full" disabled>Sign In with Email</Button>
                </form>
                <button onClick={() => setShowLogin(false)} className="w-full text-sm text-gray-500 hover:underline">Cancel</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-700 mt-24 py-12 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <Book size={16} />
              <span className="font-bold">Doctify</span>
            </div>
            <p className="text-sm text-gray-500">© 2026 Documentation Platform. Built with Google AI Studio.</p>
          </div>
        </footer>
      </div>
    </AuthContext.Provider>
  );
}
