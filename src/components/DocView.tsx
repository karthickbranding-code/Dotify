import React, { useState } from 'react';
import { Edit, Trash, Copy, Code, Link as LinkIcon, ChevronRight, FileText, Folder, Info, CheckCircle, AlertTriangle, AlertOctagon, Lightbulb } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDoc } from '../contexts/DocContext';
import { icons } from '../constants/icons';
import { Badge } from './ui/Badge';

const TabSection = ({ tabs }: { tabs: any[] }) => {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const activeTab = tabs[activeTabIdx];
  const { toast } = useDoc();

  if (!activeTab) return null;

  return (
    <>
      <div className="flex bg-gray-50 dark:bg-gray-800/50 border-b border-[var(--bd)] px-4 overflow-x-auto no-scrollbar">
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabIdx(idx)}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTabIdx === idx 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="p-8">
        {activeTab.type === 'text' ? (
          <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: activeTab.content }}
          />
        ) : (
          <div className="rounded-2xl overflow-hidden border border-[var(--bd)] bg-gray-900">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeTab.lang || 'code'}</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(activeTab.content); toast('Copied to clipboard!'); }}
                className="text-gray-400 hover:text-white transition-colors"
                title="Copy Code"
              >
                <Copy size={14} />
              </button>
            </div>
            <pre className="p-6 overflow-x-auto font-mono text-[13px] text-gray-100 leading-relaxed">
              <code>{activeTab.content}</code>
            </pre>
          </div>
        )}
      </div>
    </>
  );
};

export const DocView = () => {
  const { isEditor } = useAuth();
  const { 
    documents, curDocId, categories, setCurCatId, setView, 
    setCurDocId, setEditingDoc, setShowEditor, handleDeleteDoc,
    goDoc, toast
  } = useDoc();

  const doc = documents.find((d: any) => d.id === curDocId);
  if (!doc) return null;
  const cat = categories.find((c: any) => c.id === doc.categoryId);
  
  // Find prev/next docs in same category
  const catDocs = documents.filter((d: any) => d.categoryId === doc.categoryId);
  const idx = catDocs.findIndex((d: any) => d.id === doc.id);
  const prev = catDocs[idx - 1];
  const next = catDocs[idx + 1];

  const headings = doc.blocks.filter((b: any) => b.type === 'heading');
  const { readHistory } = useDoc();
  const recentDocs = readHistory.filter(h => h.id !== doc.id).slice(0, 4);

  return (
    <div className="max-w-[1200px] mx-auto pb-20 flex flex-col lg:flex-row gap-12">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {doc.coverImage && (
          <div className="w-full h-[300px] mb-10 relative group overflow-hidden rounded-3xl shadow-xl border border-[var(--bd)]">
            <img 
              src={doc.coverImage} 
              alt="Cover" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
          </div>
        )}

        <div className="dv-head mb-10 pb-8 border-b border-[var(--bd)] relative">
          <div className="flex items-center gap-3 mb-4">
            {cat && (
              <div 
                className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                onClick={() => { setCurCatId(cat.id); setView('cat'); }}
              >
                {React.createElement(icons.find(i => i.name === cat.icon)?.icon || Folder, { size: 12 })}
                {cat.name}
              </div>
            )}
            <div className="h-1 w-1 bg-gray-300 rounded-full" />
            <span className="text-[12px] font-medium text-[var(--tx3)]">
              {doc.updatedAt?.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          
          <div className="flex items-start justify-between gap-6">
            <h1 className="text-4xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white flex-1">
              {doc.title}
            </h1>
            {isEditor && (
              <button 
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-[var(--bd)] text-gray-700 dark:text-gray-200 text-sm font-bold hover:border-blue-500 hover:text-blue-600 hover:shadow-lg transition-all shrink-0 shadow-sm"
                onClick={() => { setEditingDoc(doc); setShowEditor(true); }}
              >
                <Edit size={16} /> Edit
              </button>
            )}
          </div>
        </div>

        <div className="space-y-10">
          {doc.blocks.map((block: any) => (
            <div key={block.id} id={`vb_${block.id}`} className="group/block relative">
              {block.type === 'heading' && (
                <div className="relative">
                  <h2 className="vb-heading group-hover/block:text-blue-600 transition-colors">{block.content}</h2>
                  <button 
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}#vb_${block.id}`;
                      navigator.clipboard.writeText(url);
                      toast('Section link copied!');
                    }}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-blue-500 opacity-0 group-hover/block:opacity-100 transition-all"
                    title="Copy section link"
                  >
                    <LinkIcon size={14} />
                  </button>
                </div>
              )}
              {block.type === 'text' && (
                <div 
                  className="vb-text prose dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-white"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )}
              {block.type === 'code' && (
                <div className="cw rounded-[var(--r3)] overflow-hidden border border-[var(--bd)] mb-5">
                  <div className="c-hd flex items-center justify-between px-3.5 py-2.25 bg-[var(--g50)] border-b border-[var(--bd)] dark:bg-[#1F2231]">
                    <span className="c-lang flex items-center gap-1.5 text-[11px] font-semibold text-[var(--tx2)]">
                      <Code size={13} /> {block.lang || 'code'}
                    </span>
                    <button 
                      className="cpbtn flex items-center gap-1.25 text-[12px] font-medium text-[var(--tx2)] hover:bg-[var(--g200)] hover:text-[var(--tx)] px-2 py-0.75 rounded-[var(--r1)] transition-all"
                      onClick={() => { navigator.clipboard.writeText(block.content || ''); toast('Copied to clipboard!'); }}
                    >
                      <Copy size={13} /> Copy
                    </button>
                  </div>
                  <pre className="m-0 bg-white dark:bg-gray-900"><code className={`language-${block.lang} block p-4 font-mono text-[13px] leading-relaxed`}>{block.content}</code></pre>
                </div>
              )}
              {block.type === 'image' && (
                <div className="vb-img mb-5">
                  <img src={block.src} alt={block.caption} className="w-full rounded-[var(--r3)] border border-[var(--bd)]" />
                  {block.caption && <p className="cap text-[12px] text-[var(--tx2)] mt-2 text-center italic">{block.caption}</p>}
                </div>
              )}
              {block.type === 'table' && (
                <div className="vb-table mb-5 overflow-x-auto">
                  <table className="w-full border-collapse rounded-[var(--r2)] overflow-hidden border border-[var(--bd)] text-[14px]">
                    <thead>
                      <tr>
                        {block.headers?.map((h: any, i: number) => (
                          <th key={i} className="px-3.5 py-2.25 bg-[var(--P1)] text-[var(--P)] text-[12px] font-semibold tracking-wider text-left border-b border-[var(--bd)] dark:bg-blue-900/15 dark:text-blue-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.data?.map((row: any, ri: number) => (
                        <tr key={ri} className="even:bg-[var(--g50)] dark:even:bg-white/2">
                          {row.map((cell: any, ci: number) => (
                            <td key={ci} className="px-3.5 py-2.25 border-b border-[var(--bd)] text-[var(--tx)] last:border-b-0">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {block.type === 'link' && (
                <div className="mb-4.5">
                  <a href={block.url} target="_blank" rel="noopener noreferrer" className="vb-lk flex items-center gap-3 px-4 py-3.25 bg-[var(--card)] border border-[var(--bd)] rounded-[var(--r3)] hover:border-[var(--P4)] shadow-[var(--s1)] hover:shadow-[var(--s2)] transition-all">
                    <div className="lk-ico w-9 h-9 rounded-[var(--r2)] bg-[var(--P1)] text-[var(--P)] flex items-center justify-center shrink-0 dark:bg-blue-900/15">
                      <LinkIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="lk-lbl text-[14px] font-medium">{block.label || block.url}</div>
                      <div className="lk-url text-[12px] text-[var(--tx2)] font-mono mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap max-w-[380px]">{block.url}</div>
                    </div>
                  </a>
                </div>
              )}
              {block.type === 'list' && (
                <div className="vb-list mb-4.5 pl-2">
                  {block.ordered ? (
                    <ol className="list-decimal pl-7 space-y-1.25">
                      {block.items?.map((item: any, i: number) => <li key={i} className="text-[16px] leading-[1.8] pl-1 marker:text-[var(--P)] marker:font-semibold">{item}</li>)}
                    </ol>
                  ) : (
                    <ul className="list-disc pl-7 space-y-1.25">
                      {block.items?.map((item: any, i: number) => <li key={i} className="text-[16px] leading-[1.8] pl-1 marker:text-[var(--P)] marker:text-[14px]">{item}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {block.type === 'tabs' && (
                <div className="vb-tabs mb-8 border border-[var(--bd)] rounded-3xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
                  <TabSection tabs={block.tabs || []} />
                </div>
              )}

              {block.type === 'callout' && (
                <div className={`vb-callout mb-8 p-6 rounded-3xl border flex gap-4 ${
                  block.calloutType === 'success' ? 'bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/20 text-green-800 dark:text-green-200' :
                  block.calloutType === 'warning' ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20 text-amber-800 dark:text-amber-200' :
                  block.calloutType === 'error' ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/20 text-red-800 dark:text-red-200' :
                  block.calloutType === 'tip' ? 'bg-purple-50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/20 text-purple-800 dark:text-purple-200' :
                  'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20 text-blue-800 dark:text-blue-200'
                }`}>
                  <div className="shrink-0 mt-1">
                    {block.calloutType === 'success' ? <CheckCircle size={20} /> :
                     block.calloutType === 'warning' ? <AlertTriangle size={20} /> :
                     block.calloutType === 'error' ? <AlertOctagon size={20} /> :
                     block.calloutType === 'tip' ? <Lightbulb size={20} /> :
                     <Info size={20} />}
                  </div>
                  <div 
                    className="prose dark:prose-invert max-w-none text-sm font-medium leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: block.content || '' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pn-nav flex items-stretch justify-between gap-3 mt-12 pt-6 border-t border-[var(--bd)]">
          {prev && (
            <div className="pn-btn prev flex items-center gap-2.5 p-3.5 px-4.5 rounded-[var(--r3)] border border-[var(--bd)] bg-[var(--card)] cursor-pointer hover:border-[var(--P4)] hover:shadow-[var(--s2)] hover:text-[var(--P)] transition-all max-w-[48%] flex-1" onClick={() => goDoc(prev.id)}>
              <div className="pn-ic w-8 h-8 rounded-[var(--r2)] bg-[var(--P1)] text-[var(--P)] flex items-center justify-center shrink-0 rotate-180 dark:bg-blue-900/15">
                <ChevronRight size={16} />
              </div>
              <div className="min-w-0">
                <div className="pn-label text-[10.5px] font-semibold text-[var(--tx2)] mb-0.5">Previous</div>
                <div className="pn-title text-[13.5px] font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]">{prev.title}</div>
              </div>
            </div>
          )}
          {next && (
            <div className="pn-btn next flex items-center flex-row-reverse gap-2.5 p-3.5 px-4.5 rounded-[var(--r3)] border border-[var(--bd)] bg-[var(--card)] cursor-pointer hover:border-[var(--P4)] hover:shadow-[var(--s2)] hover:text-[var(--P)] transition-all max-w-[48%] flex-1 ml-auto" onClick={() => goDoc(next.id)}>
              <div className="pn-ic w-8 h-8 rounded-[var(--r2)] bg-[var(--P1)] text-[var(--P)] flex items-center justify-center shrink-0 dark:bg-blue-900/15">
                <ChevronRight size={16} />
              </div>
              <div className="min-w-0 text-right">
                <div className="pn-label text-[10.5px] font-semibold text-[var(--tx2)] mb-0.5">Next</div>
                <div className="pn-title text-[13.5px] font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]">{next.title}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar (In-View) */}
      <div className="w-64 shrink-0 hidden xl:block space-y-10 sticky top-[var(--th)] h-fit pt-4">
        {headings.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">In this document</h4>
            <nav className="flex flex-col gap-2.5">
              {headings.map((h: any) => (
                <a 
                  key={h.id} 
                  href={`#vb_${h.id}`} 
                  className="text-[13px] text-gray-500 hover:text-blue-600 transition-colors font-medium leading-tight"
                >
                  {h.content}
                </a>
              ))}
            </nav>
          </div>
        )}

        {recentDocs.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Recently Viewed</h4>
            <div className="flex flex-col gap-4">
              {recentDocs.map((rd: any) => (
                <div 
                  key={rd.id} 
                  className="group cursor-pointer"
                  onClick={() => goDoc(rd.id)}
                >
                  <div className="text-[13px] font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {rd.title}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium mt-1">
                    {new Date(rd.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
