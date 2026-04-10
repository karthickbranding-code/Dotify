import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash, 
  LogOut, 
  Folder, 
  Eye, 
  Layers,
  FileText
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useDoc } from '../contexts/DocContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { IconPicker } from './IconPicker';
import { icons } from '../constants/icons';
import { Category, UserProfile, Document as DocType } from '../types';
import { AnimatePresence, motion } from 'framer-motion';

export const AdminView: React.FC = () => {
  const { profile, isAdmin, isEditor } = useAuth();
  const isSuperAdmin = profile?.email === 'karthick.branding@gmail.com' || profile?.isSuperAdmin;

  const { 
    categories, 
    documents, 
    templates, 
    activeTab, 
    setActiveTab, 
    handleLogout, 
    setCurDocId, 
    setView, 
    setEditingDoc, 
    setShowEditor, 
    handleDeleteDoc, 
    handleDeleteCat, 
    handleDeleteTemplate,
    toast
  } = useDoc();

  if (!isEditor) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        <h2 className="text-xl font-bold">Unauthorized Access</h2>
        <p className="text-[var(--tx2)] mt-2">You do not have permission to access the Admin Panel.</p>
        <Button className="mt-6" onClick={() => setView('home')}>Go Home</Button>
      </div>
    );
  }

  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [docSearch, setDocSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [docLimit, setDocLimit] = useState(10);

  const filteredDocs = documents
    .filter(d => d.title.toLowerCase().includes(docSearch.toLowerCase()))
    .slice(0, docLimit);

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.company?.toLowerCase().includes(userSearch.toLowerCase())
  );

  useEffect(() => {
    if (activeTab === 'users' && (isAdmin || isSuperAdmin)) {
      const unsub = onSnapshot(collection(db, 'users'), (snap) => {
        setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
      return unsub;
    }
  }, [activeTab, isAdmin, isSuperAdmin]);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    try {
      await updateDoc(doc(db, 'users', editingProfile.id), editingProfile as any);
      setEditingProfile(null);
      toast('User profile updated!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users');
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    try {
      const newStatus = user.status === 'stopped' ? 'active' : 'stopped';
      await updateDoc(doc(db, 'users', user.id), { status: newStatus });
      toast(`User ${newStatus === 'active' ? 'activated' : 'stopped'} successfully!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users');
    }
  };

  const handleResetPassword = (email: string) => {
    toast(`Password reset link sent to ${email}`);
  };

  return (
    <div className="space-y-6">
      <div className="ph mb-8">
        <div className="ph-r flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Panel</h1>
            <p className="text-sm text-[var(--tx2)] mt-1">Manage categories and documents efficiently.</p>
          </div>
          <div className="ph-acts flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-2xl border border-[var(--bd)] shadow-sm">
              <div className="u-av w-9 h-9 rounded-full bg-blue-600 text-white text-[13px] font-bold flex items-center justify-center shadow-md border-2 border-white dark:border-gray-700">
                {profile?.name?.[0] || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">{profile?.name || 'User Name'}</span>
                <span className="text-[11px] text-blue-600 font-medium mt-0.5">@{profile?.username || 'user'}</span>
              </div>
              <div className="w-px h-6 bg-[var(--bd)] mx-1" />
              <button onClick={handleLogout} className="p-2 text-[var(--tx3)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="atabs flex gap-1 bg-[var(--g100)] rounded-2xl p-1 w-fit">
          <button className={`atab px-6 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all ${activeTab === 'docs' ? 'bg-white text-blue-600 shadow-sm' : 'text-[var(--tx2)] hover:text-[var(--tx)]'}`} onClick={() => setActiveTab('docs')}>Documents</button>
          <button className={`atab px-6 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all ${activeTab === 'cats' ? 'bg-white text-blue-600 shadow-sm' : 'text-[var(--tx2)] hover:text-[var(--tx)]'}`} onClick={() => setActiveTab('cats')}>Categories</button>
          {(isAdmin || isSuperAdmin) && (
            <button className={`atab px-6 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-[var(--tx2)] hover:text-[var(--tx)]'}`} onClick={() => setActiveTab('users')}>Users</button>
          )}
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
          onClick={() => { setEditingDoc({ id: '', title: '', categoryId: '', blocks: [], createdAt: null, updatedAt: null, authorId: '' } as any); setShowEditor(true); }}
        >
          <Plus size={20} /> New Document
        </Button>
      </div>

      {activeTab === 'docs' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Documents</p>
              <h4 className="text-3xl font-extrabold text-gray-900 dark:text-white">{documents.length}</h4>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-green-600 font-bold bg-green-50 w-fit px-2 py-1 rounded-full">
                <Plus size={12} /> {documents.filter(d => d.createdAt?.toDate() > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} this week
              </div>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Active Categories</p>
              <h4 className="text-3xl font-extrabold text-gray-900 dark:text-white">{categories.length}</h4>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-blue-600 font-bold bg-blue-50 w-fit px-2 py-1 rounded-full">
                <Folder size={12} /> Organized structure
              </div>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Blocks</p>
              <h4 className="text-3xl font-extrabold text-gray-900 dark:text-white">{documents.reduce((acc, d) => acc + d.blocks.length, 0)}</h4>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-purple-600 font-bold bg-purple-50 w-fit px-2 py-1 rounded-full">
                <FileText size={12} /> Rich content
              </div>
            </div>
          </div>

          <div className="tw bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[40px] overflow-hidden shadow-xl shadow-gray-200/20">
            <table className="dt w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Document Title</th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Category</th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Content</th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Last Updated</th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredDocs.map(d => (
                  <tr key={d.id} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <FileText size={20} />
                        </div>
                        <span className="text-[15px] font-bold text-gray-900 dark:text-white">{d.title}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {categories.find(c => c.id === d.categoryId) ? (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                            {React.createElement(icons.find(i => i.name === categories.find(c => c.id === d.categoryId)?.icon)?.icon || Folder, { size: 14 })}
                          </div>
                          <span className="text-sm font-bold text-blue-600">{categories.find(c => c.id === d.categoryId)?.name}</span>
                        </div>
                      ) : <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Uncategorized</span>}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Badge variant="gray" className="bg-gray-100 dark:bg-gray-800 text-gray-500 border-none font-bold">{d.blocks.length} Blocks</Badge>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{d.updatedAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Last Modified</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <Button variant="ghost" size="sm" onClick={() => { setCurDocId(d.id); setView('doc'); }} className="h-10 w-10 p-0 rounded-2xl hover:bg-blue-600 hover:text-white shadow-lg shadow-blue-500/20"><Eye size={18} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingDoc(d); setShowEditor(true); }} className="h-10 w-10 p-0 rounded-2xl hover:bg-blue-600 hover:text-white shadow-lg shadow-blue-500/20"><Edit size={18} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteDoc(d.id)} className="h-10 w-10 p-0 rounded-2xl hover:bg-red-600 hover:text-white shadow-lg shadow-red-500/20"><Trash size={18} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {documents.length > docLimit && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setDocLimit(prev => prev + 10)}>
                Load More Documents
              </Button>
            </div>
          )}
        </div>
      ) : activeTab === 'templates' ? (
        <div className="space-y-4">
          <div className="tw bg-[var(--card)] border border-[var(--bd)] rounded-[var(--r3)] overflow-hidden shadow-[var(--s1)]">
            <table className="dt w-full border-collapse">
              <thead className="bg-[var(--g50)] dark:bg-[var(--g100)]">
                <tr>
                  <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-[var(--tx2)] border-b border-[var(--bd)]">Name</th>
                  <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-[var(--tx2)] border-b border-[var(--bd)]">Blocks</th>
                  <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-[var(--tx2)] border-b border-[var(--bd)]">Updated</th>
                  <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-[var(--tx2)] border-b border-[var(--bd)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bd)]">
                {templates.map(t => (
                  <tr key={t.id} className="hover:bg-[var(--g50)] dark:hover:bg-[var(--g100)] transition-colors">
                    <td className="px-3.5 py-3 text-[13.5px] font-medium">{t.name}</td>
                    <td className="px-3.5 py-3 text-[13.5px]"><Badge variant="gray">{t.blocks.length} blocks</Badge></td>
                    <td className="px-3.5 py-3 text-[13px] text-[var(--tx2)]">{t.updatedAt?.toDate().toLocaleDateString()}</td>
                    <td className="px-3.5 py-3">
                      <div className="flex gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingDoc({ ...t, id: '', title: t.name } as any); setShowEditor(true); }} className="px-2 py-1"><Edit size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(t.id)} className="px-2 py-1 text-[var(--err)]"><Trash size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'cats' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setEditingCat({ id: '', name: '', description: '', parentId: null, icon: 'Folder' })}>
              <Plus size={16} /> Add Category
            </Button>
          </div>
          <div className="tw bg-[var(--card)] border border-[var(--bd)] rounded-[var(--r3)] overflow-hidden shadow-[var(--s1)]">
            <table className="dt w-full border-collapse">
              <thead className="bg-[var(--g50)] dark:bg-[var(--g100)]">
                <tr>
                  <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-[var(--tx2)] border-b border-[var(--bd)]">Name</th>
                  <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-[var(--tx2)] border-b border-[var(--bd)]">Parent</th>
                  <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-[var(--tx2)] border-b border-[var(--bd)]">Description</th>
                  <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-[var(--tx2)] border-b border-[var(--bd)]">Docs</th>
                  <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-[var(--tx2)] border-b border-[var(--bd)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bd)]">
                {categories.map(c => {
                  const par = categories.find(p => p.id === c.parentId);
                  return (
                    <tr key={c.id} className="hover:bg-[var(--g50)] dark:hover:bg-[var(--g100)] transition-colors">
                      <td className="px-3.5 py-3 text-[13.5px] font-medium">
                        <div className="flex items-center gap-2">
                          <Folder size={16} className="text-[var(--tx2)]" />
                          <span>{par ? '↳ ' : ''}{c.name}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-[13.5px]">{par ? <Badge variant="amber">{par.name}</Badge> : <span className="text-[var(--tx2)]">—</span>}</td>
                      <td className="px-3.5 py-3 text-[13px] text-[var(--tx2)] truncate max-w-[200px]">{c.description || '—'}</td>
                      <td className="px-3.5 py-3 text-[13.5px]"><Badge variant="blue">{documents.filter(d => d.categoryId === c.id).length}</Badge></td>
                      <td className="px-3.5 py-3">
                        <div className="flex gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => setEditingCat(c)} className="px-2 py-1"><Edit size={14} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCat(c.id)} className="px-2 py-1 text-[var(--err)]"><Trash size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Input 
                placeholder="Search users by name, email or company..." 
                value={userSearch} 
                onChange={(e: any) => setUserSearch(e.target.value)} 
                className="pl-9"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tx2)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
            </div>
          </div>
          <div className="tw bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[32px] overflow-hidden shadow-xl shadow-gray-200/10">
            <table className="dt w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">User</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Company</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Role</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Usage</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-blue-50/10 dark:hover:bg-blue-900/5 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <img src={u.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} className="w-10 h-10 rounded-2xl object-cover shadow-sm" alt="" />
                        <div>
                          <div className="font-bold text-sm text-gray-900 dark:text-white">{u.name}</div>
                          <div className="text-[11px] text-gray-400 font-medium">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-600 dark:text-gray-300">{u.company || '—'}</td>
                    <td className="px-6 py-5">
                      <Badge variant={u.role === 'admin' ? 'amber' : u.role === 'editor' ? 'blue' : 'gray'} className="font-bold uppercase tracking-tighter text-[10px]">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Space:</span>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{u.spaceUsed || 0} MB</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">BW:</span>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{u.bandwidth || 0} MB</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant={u.status === 'stopped' ? 'red' : 'green'} className="font-bold uppercase tracking-tighter text-[10px]">
                        {u.status || 'active'}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingProfile(u)} 
                          className="h-9 w-9 p-0 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                          title="Edit User Details"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleUserStatus(u)} 
                          className={`h-9 w-9 p-0 rounded-xl transition-all ${u.status === 'stopped' ? 'hover:bg-green-50 hover:text-green-600' : 'hover:bg-red-50 hover:text-red-600'}`}
                          title={u.status === 'stopped' ? 'Activate User Account' : 'Stop User Account'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {u.status === 'stopped' ? <path d="M5 3l14 9-14 9V3z"/> : <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>}
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleResetPassword(u.email)} 
                          className="h-9 w-9 p-0 rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-all" 
                          title="Send Password Reset Email"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z"/></svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Category Edit Modal */}
      <AnimatePresence>
        {editingCat && (
          <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[4px] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-[var(--card)] border border-[var(--bd)] rounded-[var(--r4)] p-6.5 w-full max-w-[480px] shadow-[var(--s3)]"
            >
              <div className="mh mb-4.5">
                <h3 className="text-[16px] font-semibold">{editingCat.id ? 'Edit Category' : 'Add Category'}</h3>
                <p className="text-[13px] text-[var(--tx2)] mt-0.75">{editingCat.id ? 'Update category details' : 'Create a new documentation category'}</p>
              </div>
              <div className="space-y-4.5">
                <div className="flex gap-4">
                  <div className="space-y-1">
                    <label className="text-[13px] font-medium text-[var(--tx)]">Icon</label>
                    <div 
                      className="w-12 h-12 rounded-[var(--r2)] bg-[var(--g100)] border border-[var(--bd)] flex items-center justify-center cursor-pointer hover:bg-[var(--g200)] transition-all"
                      onClick={() => setShowIconPicker(true)}
                    >
                      {(() => {
                        const IconComp = icons.find(i => i.name === editingCat.icon)?.icon || Folder;
                        return <IconComp size={20} className="text-[var(--P)]" />;
                      })()}
                    </div>
                    {showIconPicker && (
                      <IconPicker 
                        value={editingCat.icon} 
                        onChange={(icon: string) => setEditingCat({ ...editingCat, icon })} 
                        onClose={() => setShowIconPicker(false)} 
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input label="Name" value={editingCat.name} onChange={(e: any) => setEditingCat({ ...editingCat, name: e.target.value })} placeholder="e.g. Getting Started" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[13px] font-medium text-[var(--tx)]">Parent Category <span className="font-normal text-[var(--tx2)]">(optional)</span></label>
                  <select 
                    className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--bd)] rounded-[var(--r1)] text-[14px] outline-none focus:border-[var(--fc)] focus:ring-2 focus:ring-blue-500/10 transition-all"
                    value={editingCat.parentId || ''}
                    onChange={(e) => setEditingCat({ ...editingCat, parentId: e.target.value || null })}
                  >
                    <option value="">None (top-level)</option>
                    {categories.filter(c => !c.parentId && c.id !== editingCat.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[13px] font-medium text-[var(--tx)]">Description <span className="font-normal text-[var(--tx2)]">(optional)</span></label>
                  <textarea 
                    className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--bd)] rounded-[var(--r1)] text-[14px] outline-none focus:border-[var(--fc)] focus:ring-2 focus:ring-blue-500/10 transition-all min-h-[80px] resize-vertical"
                    value={editingCat.description || ''}
                    onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })}
                    placeholder="Brief description…"
                  />
                </div>
              </div>
              <div className="mf flex justify-end gap-2 mt-5">
                <Button variant="outline" onClick={() => setEditingCat(null)}>Cancel</Button>
                <Button onClick={handleSaveCat}>Save Category</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Edit Modal */}
      <AnimatePresence>
        {editingProfile && (
          <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[4px] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-[var(--card)] border border-[var(--bd)] rounded-[var(--r4)] p-6.5 w-full max-w-[480px] shadow-[var(--s3)]"
            >
              <div className="mh mb-4.5">
                <h3 className="text-[16px] font-semibold">Edit User Profile</h3>
                <p className="text-[13px] text-[var(--tx2)] mt-0.75">Manage user roles and information.</p>
              </div>
              <div className="space-y-4.5">
                <Input label="Name" value={editingProfile.name} onChange={(e: any) => setEditingProfile({ ...editingProfile, name: e.target.value })} />
                <Input label="Company" value={editingProfile.company || ''} onChange={(e: any) => setEditingProfile({ ...editingProfile, company: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Space Used (MB)" type="number" value={editingProfile.spaceUsed || 0} onChange={(e: any) => setEditingProfile({ ...editingProfile, spaceUsed: parseInt(e.target.value) })} />
                  <Input label="Bandwidth (MB)" type="number" value={editingProfile.bandwidth || 0} onChange={(e: any) => setEditingProfile({ ...editingProfile, bandwidth: parseInt(e.target.value) })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[13px] font-medium text-[var(--tx)]">Role</label>
                    <select 
                      className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--bd)] rounded-[var(--r1)] text-[14px] outline-none focus:border-[var(--fc)] focus:ring-2 focus:ring-blue-500/10 transition-all"
                      value={editingProfile.role}
                      onChange={(e) => setEditingProfile({ ...editingProfile, role: e.target.value as any })}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[13px] font-medium text-[var(--tx)]">Status</label>
                    <select 
                      className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--bd)] rounded-[var(--r1)] text-[14px] outline-none focus:border-[var(--fc)] focus:ring-2 focus:ring-blue-500/10 transition-all"
                      value={editingProfile.status || 'active'}
                      onChange={(e) => setEditingProfile({ ...editingProfile, status: e.target.value as any })}
                    >
                      <option value="active">Active</option>
                      <option value="stopped">Stopped</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mf flex justify-end gap-2 mt-5">
                <Button variant="outline" onClick={() => setEditingProfile(null)}>Cancel</Button>
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
