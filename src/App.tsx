import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DocProvider, useDoc } from './contexts/DocContext';

// Components
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { RightSidebar } from './components/RightSidebar';
import { HomeView } from './components/HomeView';
import { CatView } from './components/CatView';
import { DocView } from './components/DocView';
import { AdminView } from './components/AdminView';
import { SearchView } from './components/SearchView';
import { ProfileView } from './components/ProfileView';
import { Editor } from './components/Editor';
import { LoginView } from './components/LoginView';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { 
    view, 
    curDocId, 
    curCatId, 
    showEditor, 
    editingDoc, 
    showLogin 
  } = useDoc();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} 
          className="w-10 h-10 border-4 border-[var(--P)] border-t-transparent rounded-full" 
        />
      </div>
    );
  }

  return (
    <div id="shell" className="flex min-h-screen bg-[var(--bg)] text-[var(--tx)]">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 ml-[var(--lw)] transition-all duration-300">
        <Topbar />
        
        <main id="main" className="mt-[var(--th)] p-8 px-7 flex-1">
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
              {view === 'search' && <SearchView />}
              {view === 'profile' && <ProfileView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {showEditor && editingDoc && (
          <Editor />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogin && (
          <LoginView />
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DocProvider>
        <AppContent />
      </DocProvider>
    </AuthProvider>
  );
}
