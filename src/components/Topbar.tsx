import React from 'react';
import { Moon, Sun, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDoc } from '../contexts/DocContext';

export const Topbar = () => {
  const { user, profile } = useAuth();
  const { 
    documents, curDocId, categories, curCatId, setView, 
    setCurCatId, view, theme, toggleTheme, handleLogout, setShowLogin 
  } = useDoc();

  const doc = documents.find((d: any) => d.id === curDocId);
  const cat = categories.find((c: any) => c.id === (curCatId || doc?.categoryId));
  
  const isSuperAdmin = profile?.email === 'karthick.branding@gmail.com' || profile?.isSuperAdmin;
  
  return (
    <header id="tb" className="fixed top-0 left-[var(--lw)] right-0 h-[var(--th)] bg-[var(--tb-bg)] border-b border-[var(--bd)] flex items-center px-5 gap-3 z-55 transition-all">
      <div className="tb-bc flex items-center gap-1.5 text-[13px] text-[var(--tx2)] min-w-0 overflow-hidden flex-1">
        <span className="bci cursor-pointer hover:text-[var(--P)] whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]" onClick={() => setView('home')}>Home</span>
        {cat && (
          <>
            <span className="bcsep text-[var(--g300)] text-[11px] shrink-0 select-none">›</span>
            <span className="bci cursor-pointer hover:text-[var(--P)] whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]" onClick={() => { setCurCatId(cat.id); setView('cat'); }}>{cat.name}</span>
          </>
        )}
        {doc && (
          <>
            <span className="bcsep text-[var(--g300)] text-[11px] shrink-0 select-none">›</span>
            <span className="bccur text-[var(--tx)] font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{doc.title}</span>
          </>
        )}
        {!cat && !doc && <span className="tb-ttl text-[15px] font-semibold text-[var(--tx)] whitespace-nowrap capitalize">{view}</span>}
        {isSuperAdmin && (
          <span className="ml-3 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-red-200">Super Admin</span>
        )}
      </div>
      <div className="tb-r ml-auto flex items-center gap-1.5 shrink-0">
        <button 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-[var(--g100)] hover:text-[var(--tx)] transition-all" 
          onClick={toggleTheme}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        {user ? (
          <div className="flex items-center gap-1.5">
            <button 
              className={`ach flex items-center gap-1.5 px-3.5 py-1.5 border border-[var(--bd)] rounded-[var(--r2)] text-[13px] font-medium text-[var(--tx2)] hover:bg-[var(--g100)] hover:text-[var(--tx)] transition-all whitespace-nowrap ${view === 'profile' ? 'on bg-[var(--P1)] border-[var(--P4)] text-[var(--P)]' : ''}`} 
              onClick={() => setView('profile')}
            >
              <UserIcon size={14} />
              {profile?.username || 'Profile'}
            </button>
            <button 
              className="ib w-8 h-8 rounded-[var(--r2)] border border-[var(--bd)] text-[var(--err)] flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/10 transition-all" 
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="ach flex items-center gap-1.5 px-3.5 py-1.5 border border-[var(--bd)] rounded-[var(--r2)] text-[13px] font-medium text-[var(--tx2)] hover:bg-[var(--g100)] hover:text-[var(--tx)] transition-all whitespace-nowrap" onClick={() => setShowLogin(true)}>
            <UserIcon size={14} />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
