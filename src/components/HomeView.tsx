import React from 'react';
import { Folder } from 'lucide-react';
import { useDoc } from '../contexts/DocContext';
import { icons } from '../constants/icons';
import { Badge } from './ui/Badge';

export const HomeView = () => {
  const { categories, setCurCatId, setView, documents } = useDoc();
  const topCats = categories.filter((c: any) => !c.parentId);
  return (
    <div className="space-y-12 max-w-[1200px] mx-auto">
      <div className="py-8 px-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3">Documentation</h1>
        <p className="text-lg text-[var(--tx2)] max-w-2xl leading-relaxed">
          Browse guides, references and tutorials.
        </p>
      </div>

      <div className="space-y-6">
        <div id="hgrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topCats.map((cat: any) => (
            <div 
              key={cat.id}
              onClick={() => { setCurCatId(cat.id); setView('cat'); }}
              className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[32px] p-8 cursor-pointer shadow-sm hover:shadow-2xl hover:border-blue-500/50 transition-all duration-500 flex flex-col h-full"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                {icons.find(i => i.name === cat.icon)?.icon ? React.createElement(icons.find(i => i.name === cat.icon)!.icon, { size: 32 }) : <Folder size={32} />}
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{cat.name}</h3>
              <p className="text-base text-[var(--tx2)] leading-relaxed line-clamp-2 mb-8 flex-grow">{cat.description || 'Browse documentation in this category.'}</p>
              
              <div className="flex items-center gap-3 pt-6 border-t border-gray-50 dark:border-gray-700">
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full text-xs font-bold">
                  {documents.filter((d: any) => d.categoryId === cat.id).length} docs
                </div>
                {categories.some((c: any) => c.parentId === cat.id) && (
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-bold">
                    Subtopics
                  </div>
                )}
              </div>
            </div>
          ))}
        {topCats.length === 0 && (
          <div className="empty text-center py-12 col-span-full">
            <div className="ei w-12 h-12 rounded-[var(--r3)] bg-[var(--P1)] text-[var(--P)] flex items-center justify-center mx-auto mb-3.5">
              <Folder size={24} />
            </div>
            <h3 className="text-[16px] font-bold text-[var(--tx)] mb-1">No categories yet</h3>
            <p className="text-[14px] text-[var(--tx2)]">Log in as admin to get started.</p>
          </div>
        )}
      </div>
    </div>
  </div>
);
};
