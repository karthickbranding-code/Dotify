import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Save, Plus, Trash, GripVertical, ChevronDown, 
  Type, Heading, Code, Image as ImageIcon, Link as LinkIcon, 
  List as ListIcon, Table as TableIcon, Search, Check, 
  Layout, Upload, MousePointer2, FileText, RefreshCw,
  ArrowUp, ArrowDown, ImagePlus, Columns, AlertCircle
} from 'lucide-react';
import { doc, updateDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useDoc, serializeBlocks } from '../contexts/DocContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { IconPicker } from './IconPicker';
import { RichTextEditor } from './RichTextEditor';
import { DocBlock, Document } from '../types';
import { icons } from '../constants/icons';

export const Editor = () => {
  const { user } = useAuth();
  const { 
    editingDoc, setEditingDoc, showEditor, setShowEditor, 
    categories, toast, pushEdit 
  } = useDoc();
  
  const [docData, setDocData] = useState<Document>(() => {
    if (editingDoc) return editingDoc;
    return {
      id: '',
      title: '',
      categoryId: '',
      icon: 'FileText',
      blocks: [{ id: '1', type: 'text', content: '' }],
      authorId: user?.uid || ''
    } as Document;
  });
  
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<number | null>(null);
  const [showFabMenu, setShowFabMenu] = useState(false);

  useEffect(() => {
    if (editingDoc) {
      setDocData(editingDoc);
    } else {
      setDocData({
        id: '',
        title: '',
        categoryId: '',
        icon: 'FileText',
        blocks: [{ id: '1', type: 'text', content: '' }],
        authorId: user?.uid || ''
      } as Document);
    }
  }, [editingDoc, user]);

  const handleSave = async () => {
    if (!docData.title) return toast('Title is required');
    if (!docData.categoryId) return toast('Category is required');
    
    setIsSaving(true);
    try {
      const payload = {
        ...docData,
        blocks: serializeBlocks(docData.blocks),
        updatedAt: serverTimestamp(),
        authorId: user?.uid,
      };
      
      if (docData.id) {
        await updateDoc(doc(db, 'documents', docData.id), payload as any);
        pushEdit(docData.id);
      } else {
        const newDocRef = doc(collection(db, 'documents'));
        await setDoc(newDocRef, { ...payload, id: newDocRef.id, createdAt: serverTimestamp() });
        pushEdit(newDocRef.id);
      }
      
      toast('Document saved successfully!');
      setShowEditor(false);
      setEditingDoc(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'documents');
    } finally {
      setIsSaving(false);
    }
  };

  const addBlock = (type: DocBlock['type'], index: number) => {
    const newBlock: DocBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: '',
      ...(type === 'image' && { src: '', caption: '' }),
      ...(type === 'link' && { url: '', label: '' }),
      ...(type === 'code' && { lang: 'javascript' }),
      ...(type === 'table' && { headers: ['Col 1', 'Col 2'], data: [['', '']] }),
      ...(type === 'list' && { items: [''], ordered: false }),
      ...(type === 'tabs' && { tabs: [{ id: 't1', title: 'Tab 1', content: '', type: 'text' }] }),
      ...(type === 'callout' && { calloutType: 'info', content: '' })
    };
    const newBlocks = [...docData.blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setDocData({ ...docData, blocks: newBlocks });
    setActiveBlockId(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<DocBlock>) => {
    setDocData({
      ...docData,
      blocks: docData.blocks.map(b => b.id === id ? { ...b, ...updates } : b)
    });
  };

  const removeBlock = (id: string) => {
    if (docData.blocks.length === 1) return;
    setDocData({
      ...docData,
      blocks: docData.blocks.filter(b => b.id !== id)
    });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...docData.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setDocData({ ...docData, blocks: newBlocks });
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocData({ ...docData, coverImage: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeCoverImage = () => {
    setDocData({ ...docData, coverImage: undefined });
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateBlock(id, { src: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (!showEditor) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-[var(--bg)] flex flex-col">
      <header className="h-[var(--th)] border-b border-[var(--bd)] bg-white dark:bg-gray-900 flex items-center px-8 justify-between shrink-0 sticky top-0 z-[310] shadow-sm">
        <div className="flex items-center gap-6 flex-1">
          <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-colors">
            <X size={20} />
          </button>
          <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex items-center gap-4 flex-1 max-w-3xl">
            <button 
              onClick={() => setShowIconPicker(true)}
              className="w-12 h-12 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-blue-600 hover:border-blue-400 hover:shadow-md transition-all shrink-0 overflow-hidden"
            >
              {docData.icon?.startsWith('data:image') || docData.icon?.startsWith('http') ? (
                <img src={docData.icon} className="w-full h-full object-cover" alt="" />
              ) : (
                React.createElement(icons.find(i => i.name === (docData.icon || 'FileText'))?.icon || FileText, { size: 24 })
              )}
            </button>
            <div className="flex flex-col flex-1">
              <input 
                className="bg-transparent text-xl font-bold outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 w-full"
                placeholder="Enter document title..."
                value={docData.title}
                onChange={e => setDocData({ ...docData, title: e.target.value })}
              />
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">Document Editor</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <select 
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer min-w-[220px]"
            value={docData.categoryId}
            onChange={e => setDocData({ ...docData, categoryId: e.target.value })}
          >
            <option value="">Select Category</option>
            {(() => {
              const renderOptions = (parentId: string | null = null, depth = 0) => {
                return categories
                  .filter(c => c.parentId === parentId)
                  .map(c => (
                    <React.Fragment key={c.id}>
                      <option value={c.id}>
                        {'\u00A0'.repeat(depth * 4)}{c.name}
                      </option>
                      {renderOptions(c.id, depth + 1)}
                    </React.Fragment>
                  ));
              };
              return renderOptions();
            })()}
          </select>
          <div className="h-10 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2"></div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all flex items-center gap-3 active:scale-95"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Saving...' : 'Publish Document'}
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-white dark:bg-[#0F111A] py-12 custom-scrollbar">
          <div className="max-w-[840px] mx-auto px-6 space-y-8">
            {/* Cover Image Placeholder */}
            {docData.coverImage ? (
              <div className="relative h-64 w-full rounded-3xl overflow-hidden group/cover border border-[var(--bd)] shadow-sm">
                <img src={docData.coverImage} className="w-full h-full object-cover" alt="Cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <div className="relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleCoverImageUpload}
                      accept="image/*"
                    />
                    <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white text-gray-900 border-none shadow-lg">
                      <ImagePlus size={16} className="mr-2" /> Change Cover
                    </Button>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={removeCoverImage}
                    className="bg-red-500/90 hover:bg-red-500 text-white border-none shadow-lg"
                  >
                    <Trash size={16} className="mr-2" /> Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative h-48 w-full bg-[var(--g100)] rounded-3xl overflow-hidden group/cover border border-[var(--bd)] border-dashed flex items-center justify-center hover:bg-[var(--g200)] transition-all cursor-pointer">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleCoverImageUpload}
                  accept="image/*"
                />
                <div className="flex flex-col items-center gap-2 text-[var(--tx3)] group-hover/cover:text-[var(--P)] transition-colors">
                  <ImageIcon size={32} />
                  <span className="text-sm font-bold">Add Cover Image</span>
                </div>
              </div>
            )}

            {docData.blocks.map((block, idx) => (
              <div 
                key={block.id}
                className={`group relative bg-[var(--card)] border rounded-2xl transition-all ${activeBlockId === block.id ? 'border-[var(--P4)] shadow-lg ring-4 ring-blue-500/5' : 'border-[var(--bd)] hover:border-[var(--g300)] shadow-sm'}`}
                onClick={() => setActiveBlockId(block.id)}
              >
                <div className="absolute -left-14 top-4 flex flex-col gap-1.5 p-1.5 bg-white dark:bg-gray-800 rounded-2xl border border-[var(--bd)] shadow-xl z-20">
                  <button className="p-2 text-[var(--tx3)] hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-grab active:cursor-grabbing" title="Drag to reorder">
                    <GripVertical size={18} />
                  </button>
                  <div className="w-full h-px bg-[var(--bd)]" />
                  <button onClick={() => removeBlock(block.id)} className="p-2 text-[var(--tx3)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete block">
                    <Trash size={18} />
                  </button>
                </div>

                <div className="absolute -right-14 top-4 flex flex-col gap-1.5 p-1.5 bg-white dark:bg-gray-800 rounded-2xl border border-[var(--bd)] shadow-xl z-20">
                  <button 
                    onClick={() => moveBlock(idx, 'up')} 
                    disabled={idx === 0}
                    className="p-2 text-[var(--tx3)] hover:text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    title="Move up"
                  >
                    <ArrowUp size={18} />
                  </button>
                  <div className="w-full h-px bg-[var(--bd)]" />
                  <button 
                    onClick={() => moveBlock(idx, 'down')} 
                    disabled={idx === docData.blocks.length - 1}
                    className="p-2 text-[var(--tx3)] hover:text-blue-600 hover:bg-blue-50 rounded-xl disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    title="Move down"
                  >
                    <ArrowDown size={18} />
                  </button>
                </div>

                <div className="p-6">
                  {block.type === 'heading' && (
                    <input 
                      autoFocus
                      className="w-full text-2xl font-bold bg-transparent outline-none placeholder:text-[var(--txd)]"
                      placeholder="Section Heading"
                      value={block.content}
                      onChange={e => updateBlock(block.id, { content: e.target.value })}
                    />
                  )}

                  {block.type === 'text' && (
                    <RichTextEditor 
                      content={block.content || ''} 
                      onChange={val => updateBlock(block.id, { content: val })} 
                    />
                  )}

                  {block.type === 'code' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <select 
                          className="text-xs font-bold uppercase tracking-wider bg-[var(--g100)] px-2 py-1 rounded border border-[var(--bd)]"
                          value={block.lang}
                          onChange={e => updateBlock(block.id, { lang: e.target.value })}
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="typescript">TypeScript</option>
                          <option value="python">Python</option>
                          <option value="html">HTML</option>
                          <option value="css">CSS</option>
                          <option value="sql">SQL</option>
                          <option value="bash">Bash</option>
                        </select>
                      </div>
                      <textarea 
                        className="w-full h-48 p-4 font-mono text-sm bg-gray-900 text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Paste your code here..."
                        value={block.content}
                        onChange={e => updateBlock(block.id, { content: e.target.value })}
                      />
                    </div>
                  )}

                  {block.type === 'image' && (
                    <div className="space-y-4">
                      {block.src ? (
                        <div className="relative rounded-xl overflow-hidden border border-[var(--bd)] group/img">
                          <img src={block.src} className="w-full h-auto max-h-[400px] object-contain bg-black/5" alt="" />
                          <button 
                            onClick={() => updateBlock(block.id, { src: '' })}
                            className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-[var(--bd)] rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-[var(--g50)] hover:bg-[var(--g100)] transition-colors group/upload">
                          <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm group-hover/upload:scale-110 transition-transform">
                            <Upload size={24} className="text-[var(--P)]" />
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-lg">Upload an image</p>
                            <p className="text-sm text-[var(--tx2)] mt-1">Drag and drop or click to browse</p>
                          </div>
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(block.id, e)} accept="image/*" />
                        </div>
                      )}
                      <Input 
                        placeholder="Image caption (optional)" 
                        value={block.caption} 
                        onChange={(e: any) => updateBlock(block.id, { caption: e.target.value })} 
                      />
                    </div>
                  )}

                  {block.type === 'link' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Link Label" value={block.label} onChange={(e: any) => updateBlock(block.id, { label: e.target.value })} placeholder="e.g. Documentation" />
                      <Input label="URL" value={block.url} onChange={(e: any) => updateBlock(block.id, { url: e.target.value })} placeholder="https://..." />
                    </div>
                  )}

                  {block.type === 'table' && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-[var(--bd)] rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-[var(--g50)]">
                            {block.headers?.map((h, i) => (
                              <th key={i} className="p-2 border border-[var(--bd)]">
                                <input className="w-full bg-transparent font-bold text-center outline-none" value={h} onChange={e => {
                                  const newHeaders = [...(block.headers || [])];
                                  newHeaders[i] = e.target.value;
                                  updateBlock(block.id, { headers: newHeaders });
                                }} />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {block.data?.map((row, ri) => (
                            <tr key={ri}>
                              {row.map((cell, ci) => (
                                <td key={ci} className="p-2 border border-[var(--bd)]">
                                  <input className="w-full bg-transparent outline-none" value={cell} onChange={e => {
                                    const newData = [...(block.data || [])];
                                    newData[ri][ci] = e.target.value;
                                    updateBlock(block.id, { data: newData });
                                  }} />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-4 flex gap-3 border-t border-[var(--bd)] pt-4">
                        <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600" onClick={() => {
                          const newData = [...(block.data || []), new Array(block.headers?.length || 2).fill('')];
                          updateBlock(block.id, { data: newData });
                        }}>
                          <Plus size={14} /> Add Row
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600" onClick={() => {
                          const newHeaders = [...(block.headers || []), `Col ${(block.headers || []).length + 1}`];
                          const newData = (block.data || []).map(row => [...row, '']);
                          updateBlock(block.id, { headers: newHeaders, data: newData });
                        }}>
                          <Plus size={14} /> Add Column
                        </Button>
                      </div>
                    </div>
                  )}

                  {block.type === 'list' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 mb-2">
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                          <input type="checkbox" checked={block.ordered} onChange={e => updateBlock(block.id, { ordered: e.target.checked })} className="rounded text-[var(--P)]" />
                          Ordered List
                        </label>
                      </div>
                      {block.items?.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[var(--tx2)] font-mono text-sm w-4">{block.ordered ? `${i+1}.` : '•'}</span>
                          <input 
                            className="flex-1 bg-transparent outline-none py-1 border-b border-transparent focus:border-[var(--P4)] transition-all"
                            value={item}
                            onChange={e => {
                              const newItems = [...(block.items || [])];
                              newItems[i] = e.target.value;
                              updateBlock(block.id, { items: newItems });
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const newItems = [...(block.items || [])];
                                newItems.splice(i + 1, 0, '');
                                updateBlock(block.id, { items: newItems });
                              }
                            }}
                          />
                          <button onClick={() => {
                            const newItems = (block.items || []).filter((_, idx) => idx !== i);
                            updateBlock(block.id, { items: newItems.length ? newItems : [''] });
                          }} className="p-1 text-red-400 opacity-0 group-hover:opacity-100">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {block.type === 'tabs' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 border-b border-[var(--bd)] pb-2">
                        {block.tabs?.map((tab, ti) => (
                          <div key={tab.id} className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-t-xl border border-[var(--bd)] border-b-0">
                            <input 
                              className="bg-transparent text-xs font-bold outline-none w-20"
                              value={tab.title}
                              onChange={e => {
                                const newTabs = [...(block.tabs || [])];
                                newTabs[ti] = { ...tab, title: e.target.value };
                                updateBlock(block.id, { tabs: newTabs });
                              }}
                            />
                            <button onClick={() => {
                              const newTabs = (block.tabs || []).filter((_, idx) => idx !== ti);
                              updateBlock(block.id, { tabs: newTabs.length ? newTabs : [{ id: '1', title: 'Tab 1', content: '', type: 'text' }] });
                            }} className="text-gray-400 hover:text-red-500">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            const newTabs = [...(block.tabs || []), { id: Math.random().toString(36).substr(2, 9), title: `Tab ${(block.tabs?.length || 0) + 1}`, content: '', type: 'text' as const }];
                            updateBlock(block.id, { tabs: newTabs });
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {block.tabs?.map((tab, ti) => (
                          <div key={tab.id} className="space-y-3 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-[var(--bd)]">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Content for: {tab.title}</span>
                              <select 
                                className="text-[10px] font-bold uppercase bg-white dark:bg-gray-800 border border-[var(--bd)] px-2 py-1 rounded"
                                value={tab.type}
                                onChange={e => {
                                  const newTabs = [...(block.tabs || [])];
                                  newTabs[ti] = { ...tab, type: e.target.value as any };
                                  updateBlock(block.id, { tabs: newTabs });
                                }}
                              >
                                <option value="text">Rich Text</option>
                                <option value="code">Code Snippet</option>
                              </select>
                            </div>
                            {tab.type === 'text' ? (
                              <RichTextEditor 
                                content={tab.content} 
                                onChange={val => {
                                  const newTabs = [...(block.tabs || [])];
                                  newTabs[ti] = { ...tab, content: val };
                                  updateBlock(block.id, { tabs: newTabs });
                                }} 
                              />
                            ) : (
                              <div className="space-y-2">
                                <select 
                                  className="text-[10px] font-bold uppercase bg-white dark:bg-gray-800 border border-[var(--bd)] px-2 py-1 rounded"
                                  value={tab.lang || 'javascript'}
                                  onChange={e => {
                                    const newTabs = [...(block.tabs || [])];
                                    newTabs[ti] = { ...tab, lang: e.target.value };
                                    updateBlock(block.id, { tabs: newTabs });
                                  }}
                                >
                                  <option value="javascript">JavaScript</option>
                                  <option value="typescript">TypeScript</option>
                                  <option value="python">Python</option>
                                  <option value="html">HTML</option>
                                  <option value="css">CSS</option>
                                </select>
                                <textarea 
                                  className="w-full h-32 p-3 font-mono text-xs bg-gray-900 text-gray-100 rounded-xl outline-none"
                                  placeholder="Paste code here..."
                                  value={tab.content}
                                  onChange={e => {
                                    const newTabs = [...(block.tabs || [])];
                                    newTabs[ti] = { ...tab, content: e.target.value };
                                    updateBlock(block.id, { tabs: newTabs });
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {block.type === 'callout' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Card Type:</span>
                        <div className="flex gap-2">
                          {(['info', 'success', 'warning', 'error', 'tip'] as const).map(t => (
                            <button 
                              key={t}
                              onClick={() => updateBlock(block.id, { calloutType: t })}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${block.calloutType === t ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 border-[var(--bd)] text-gray-500 hover:border-blue-400'}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <RichTextEditor 
                        content={block.content || ''} 
                        onChange={val => updateBlock(block.id, { content: val })} 
                      />
                    </div>
                  )}
                </div>

                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 z-10">
                  <div className="flex items-center gap-1 p-1.5 bg-[var(--card)] border border-[var(--bd)] rounded-full shadow-xl">
                    <button onClick={() => addBlock('text', idx)} className="p-2 hover:bg-[var(--P1)] hover:text-[var(--P)] rounded-full transition-all" title="Add Text"><Type size={18} /></button>
                    <button onClick={() => addBlock('heading', idx)} className="p-2 hover:bg-[var(--P1)] hover:text-[var(--P)] rounded-full transition-all" title="Add Heading"><Heading size={18} /></button>
                    <button onClick={() => addBlock('code', idx)} className="p-2 hover:bg-[var(--P1)] hover:text-[var(--P)] rounded-full transition-all" title="Add Code"><Code size={18} /></button>
                    <button onClick={() => addBlock('image', idx)} className="p-2 hover:bg-[var(--P1)] hover:text-[var(--P)] rounded-full transition-all" title="Add Image"><ImageIcon size={18} /></button>
                    <button onClick={() => addBlock('link', idx)} className="p-2 hover:bg-[var(--P1)] hover:text-[var(--P)] rounded-full transition-all" title="Add Link"><LinkIcon size={18} /></button>
                    <button onClick={() => addBlock('list', idx)} className="p-2 hover:bg-[var(--P1)] hover:text-[var(--P)] rounded-full transition-all" title="Add List"><ListIcon size={18} /></button>
                    <button onClick={() => addBlock('table', idx)} className="p-2 hover:bg-[var(--P1)] hover:text-[var(--P)] rounded-full transition-all" title="Add Table"><TableIcon size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Floating Action Button for Block Insertion (Screenshot 4) */}
        <div className="fixed bottom-8 right-8 z-[400] flex flex-col items-end gap-4">
          <AnimatePresence>
            {showFabMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-[var(--card)] border border-[var(--bd)] rounded-3xl shadow-2xl p-3 flex flex-col min-w-[240px] mb-4"
              >
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-2">Insert Block</p>
                <button onClick={() => { addBlock('heading', docData.blocks.length - 1); setShowFabMenu(false); }} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all group">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all"><Heading size={18} /></div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Section Heading</p>
                    <p className="text-[10px] text-gray-400">Appears in right sidebar TOC</p>
                  </div>
                </button>
                <button onClick={() => { addBlock('text', docData.blocks.length - 1); setShowFabMenu(false); }} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all group">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Type size={18} /></div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Text</p>
                    <p className="text-[10px] text-gray-400">Paragraph · Bold / Italic / Color</p>
                  </div>
                </button>
                <button onClick={() => { addBlock('code', docData.blocks.length - 1); setShowFabMenu(false); }} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all group">
                  <div className="p-2 bg-gray-100 text-gray-700 rounded-xl group-hover:bg-gray-700 group-hover:text-white transition-all"><Code size={18} /></div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Code Snippet</p>
                    <p className="text-[10px] text-gray-400">Syntax highlighted</p>
                  </div>
                </button>
                <button onClick={() => { addBlock('table', docData.blocks.length - 1); setShowFabMenu(false); }} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all group">
                  <div className="p-2 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-all"><TableIcon size={18} /></div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Table</p>
                    <p className="text-[10px] text-gray-400">Rows × columns grid</p>
                  </div>
                </button>
                <button onClick={() => { addBlock('image', docData.blocks.length - 1); setShowFabMenu(false); }} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all group">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-all"><ImageIcon size={18} /></div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Image</p>
                    <p className="text-[10px] text-gray-400">Upload + auto crop 16:9</p>
                  </div>
                </button>
                <button onClick={() => { addBlock('link', docData.blocks.length - 1); setShowFabMenu(false); }} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all group">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><LinkIcon size={18} /></div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Link Card</p>
                    <p className="text-[10px] text-gray-400">URL with label</p>
                  </div>
                </button>
                <button onClick={() => { addBlock('list', docData.blocks.length - 1); setShowFabMenu(false); }} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all group">
                  <div className="p-2 bg-pink-50 text-pink-600 rounded-xl group-hover:bg-pink-600 group-hover:text-white transition-all"><ListIcon size={18} /></div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">List</p>
                    <p className="text-[10px] text-gray-400">Bullet or numbered</p>
                  </div>
                </button>
                <button onClick={() => { addBlock('tabs', docData.blocks.length - 1); setShowFabMenu(false); }} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all group">
                  <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl group-hover:bg-cyan-600 group-hover:text-white transition-all"><Columns size={18} /></div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Tab Section</p>
                    <p className="text-[10px] text-gray-400">Dynamic tabbed content</p>
                  </div>
                </button>
                <button onClick={() => { addBlock('callout', docData.blocks.length - 1); setShowFabMenu(false); }} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all group">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-all"><AlertCircle size={18} /></div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Callout Card</p>
                    <p className="text-[10px] text-gray-400">Success, Warning, Info, etc.</p>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setShowFabMenu(!showFabMenu)}
            className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${showFabMenu ? 'bg-red-500 text-white rotate-45' : 'bg-blue-600 text-white hover:scale-110'}`}
          >
            <Plus size={28} />
          </button>
        </div>
      </div>

      {showIconPicker && (
        <IconPicker 
          value={docData.icon || 'FileText'}
          onChange={val => setDocData({ ...docData, icon: val })} 
          onClose={() => setShowIconPicker(false)} 
        />
      )}
    </div>
  );
};
