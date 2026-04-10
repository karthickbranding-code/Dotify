import React from 'react';
import { Folder, FileText, ChevronRight } from 'lucide-react';
import { useDoc } from '../contexts/DocContext';
import { icons } from '../constants/icons';
import { Badge } from './ui/Badge';

export const CatView = () => {
  const { categories, curCatId, setCurCatId, documents, setCurDocId, setView, pushRead } = useDoc();
  const cat = categories.find((c: any) => c.id === curCatId);
  if (!cat) return null;
  const subCats = categories.filter((c: any) => c.parentId === cat.id);
  const catDocs = documents.filter((d: any) => d.categoryId === cat.id);
  return (
    <div className="space-y-8">
      <div className="ph mb-6">
        <div className="ph-r flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {icons.find(i => i.name === cat.icon)?.icon ? React.createElement(icons.find(i => i.name === cat.icon)!.icon, { size: 24, className: "text-[var(--P)]" }) : <Folder size={24} className="text-[var(--P)]" />}
              <h1 className="text-[32px] font-bold tracking-tight">{cat.name}</h1>
            </div>
            <p className="text-[16px] text-[var(--tx2)] mt-1">{cat.description}</p>
          </div>
        </div>
      </div>
      
      {subCats.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-[20px] font-bold px-1">Subtopics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subCats.map((s: any) => (
              <div 
                key={s.id} 
                onClick={() => setCurCatId(s.id)}
                className="dc bg-[var(--card)] border border-[var(--bd)] rounded-[var(--r3)] p-5 cursor-pointer shadow-[var(--s1)] transition-all hover:shadow-[var(--s2)] hover:border-[var(--P4)] hover:-translate-y-0.5"
              >
                <div className="dc-ico w-[38px] h-[38px] rounded-[var(--r2)] bg-[var(--P1)] text-[var(--P)] flex items-center justify-center mb-3">
                  {icons.find(i => i.name === s.icon)?.icon ? React.createElement(icons.find(i => i.name === s.icon)!.icon, { size: 20 }) : <Folder size={20} />}
                </div>
                <h3 className="text-[16px] font-bold mb-1.5 leading-tight">{s.name}</h3>
                <p className="text-[14px] text-[var(--tx2)] leading-relaxed line-clamp-2">{s.description}</p>
                <div className="dc-ft flex items-center gap-2 mt-3 pt-3 border-t border-[var(--bd)]">
                  <Badge variant="gray">Subtopic</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {subCats.length > 0 && <h2 className="text-[20px] font-bold px-1">Documents</h2>}
        <div className="flex flex-col gap-4">
          {catDocs.map((d: any) => (
            <div 
              key={d.id} 
              onClick={() => { setCurDocId(d.id); setView('doc'); pushRead(d.id); }}
              className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 cursor-pointer flex items-center justify-between hover:border-blue-500/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  {icons.find(i => i.name === d.icon)?.icon ? React.createElement(icons.find(i => i.name === d.icon)!.icon, { size: 24 }) : <FileText size={24} />}
                </div>
                <div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{d.title}</div>
                  <div className="text-sm text-gray-400 mt-1 font-medium">
                    {d.updatedAt?.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-300">
                <ChevronRight size={18} />
              </div>
            </div>
          ))}
          {catDocs.length === 0 && !subCats.length && (
            <div className="empty text-center py-12">
              <div className="ei w-12 h-12 rounded-[var(--r3)] bg-[var(--P1)] text-[var(--P)] flex items-center justify-center mx-auto mb-3.5">
                <FileText size={24} />
              </div>
              <h3 className="text-[16px] font-bold text-[var(--tx)] mb-1">No documents yet</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
