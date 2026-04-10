import React from 'react';
import { Book, Home, Folder, FileText, ChevronRight, User as UserIcon, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDoc } from '../contexts/DocContext';
import { icons } from '../constants/icons';

export const Sidebar = () => {
  const { user } = useAuth();
  const { 
    view, setView, setCurDocId, categories, documents, 
    curDocId, setCurCatId, pushRead 
  } = useDoc();
  
  const [expandedCats, setExpandedCats] = React.useState<Record<string, boolean>>({});

  const toggleCat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const topCats = categories.filter((c: any) => !c.parentId);

  const renderCategory = (cat: any, level: number = 0) => {
    const kids = categories.filter((c: any) => c.parentId === cat.id);
    const catDocs = documents.filter((d: any) => d.categoryId === cat.id);
    const IconComp = icons.find(i => i.name === cat.icon)?.icon || Folder;
    const isExpanded = expandedCats[cat.id];

    return (
      <div key={cat.id}>
        <div 
          className={`ncg-hd ${isExpanded ? 'open' : ''} ${level > 0 ? 'text-[13px]' : ''}`} 
          style={{ paddingLeft: level === 0 ? '14px' : `${14 + level * 12}px` }}
          onClick={(e) => {
            if (kids.length > 0 || catDocs.length > 0) {
              toggleCat(cat.id, e);
            } else {
              setCurCatId(cat.id);
            }
          }}
        >
          <span className="ncg-l flex items-center gap-2 overflow-hidden min-w-0">
            <IconComp size={16} className="shrink-0" />
            <span className="ncg-lbl overflow-hidden text-ellipsis">{cat.name}</span>
          </span>
          {(kids.length > 0 || catDocs.length > 0) && (
            <ChevronRight size={11} className={`caret shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          )}
        </div>
        {isExpanded && (
          <div className="ncg-kids open">
            {catDocs.map((d: any) => {
              const DocIcon = icons.find(i => i.name === d.icon)?.icon || FileText;
              return (
                <div 
                  key={d.id} 
                  className={`ni text-[13px] relative ${curDocId === d.id ? 'on' : ''}`} 
                  style={{ paddingLeft: `${14 + (level + 1) * 12}px` }}
                  onClick={() => { setCurDocId(d.id); setView('doc'); pushRead(d.id); }}
                >
                  <DocIcon size={14} className="mr-1 shrink-0 opacity-70" />
                  <span className="ni-lbl overflow-hidden text-ellipsis flex-1">{d.title}</span>
                </div>
              );
            })}
            {kids.map((kid: any) => renderCategory(kid, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside id="lsb" className="w-[var(--lw)] min-h-screen bg-[var(--side)] border-r border-[var(--bd)] fixed left-0 top-0 bottom-0 flex flex-col z-60 overflow-hidden">
      <div className="lsb-logo h-[var(--th)] flex items-center px-4 gap-2.5 border-b border-[var(--bd)] shrink-0">
        <div className="lsb-mark w-[30px] h-[30px] rounded-[var(--r2)] bg-[var(--P)] flex items-center justify-center shrink-0 text-white">
          <Book size={18} />
        </div>
        <div className="lsb-name">
          <h2 className="text-[14px] font-semibold text-[var(--tx)] leading-tight">Doctify</h2>
          <p className="text-[10.5px] text-[var(--tx2)]">Documentation</p>
        </div>
      </div>
      <nav className="lsb-nav flex-1 overflow-y-auto overflow-x-hidden py-2">
        <div className="lsb-sec text-[11px] font-semibold text-[var(--tx2)] px-3.5 pt-2.5 pb-1 uppercase tracking-wider">Navigation</div>
        <div className={`ni ${view === 'home' ? 'on' : ''}`} onClick={() => { setView('home'); setCurDocId(null); }}>
          <Home size={16} className="shrink-0" />
          <span className="ni-lbl overflow-hidden text-ellipsis flex-1">Home</span>
        </div>

        {topCats.map((cat: any) => renderCategory(cat))}

        {user && (
          <>
            <div className="h-[1px] bg-[var(--bd)] my-2.5"></div>
            <div className="lsb-sec text-[11px] font-semibold text-[var(--tx2)] px-3.5 pt-2.5 pb-1">Account</div>
            <div className={`ni ${view === 'profile' ? 'on' : ''}`} onClick={() => setView('profile')}>
              <UserIcon size={16} className="shrink-0" />
              <span className="ni-lbl overflow-hidden text-ellipsis flex-1">My Profile</span>
            </div>
            <div className={`ni ${view === 'admin' ? 'on' : ''}`} onClick={() => setView('admin')}>
              <Settings size={16} className="shrink-0" />
              <span className="ni-lbl overflow-hidden text-ellipsis flex-1">Admin Panel</span>
            </div>
          </>
        )}
      </nav>
      <div className="lsb-foot shrink-0 border-t border-[var(--bd)] p-3 bg-[var(--side)]">
        <div className="sb-ad rounded-[var(--r2)] overflow-hidden border border-[var(--bd)] bg-[var(--card)] cursor-pointer transition-shadow hover:shadow-[var(--s2)]">
          <div className="sb-ad-body p-2.5">
            <div className="sb-ad-label text-[11px] font-semibold text-[var(--tx2)] mb-1">📢 Announcement</div>
            <div className="sb-ad-text text-[12px] text-[var(--tx)] leading-tight">Doctify v2.0 launching soon. <span className="text-[var(--P)] font-medium">Learn more →</span></div>
          </div>
        </div>
      </div>
    </aside>
  );
};
