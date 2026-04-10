import React from 'react';
import { Book, Edit, FileText, Clock, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDoc } from '../contexts/DocContext';

export const RightSidebar = () => {
  const { user } = useAuth();
  const { 
    view, documents, curDocId, editHistory, setEditingDoc, 
    setShowEditor, setEditHistory, readHistory, setCurDocId, 
    setView, setReadHistory 
  } = useDoc();

  const doc = documents.find((d: any) => d.id === curDocId);
  const headings = doc?.blocks.filter((b: any) => b.type === 'heading') || [];

  return (
    <aside id="rsb" className="w-[var(--rw)] bg-[var(--rsb-bg)] border-l border-[var(--bd)] fixed right-0 top-0 bottom-0 flex flex-col z-50 overflow-hidden transition-all">
      <div className="rsb-spacer h-[var(--th)] border-b border-[var(--bd)] shrink-0 bg-[var(--rsb-bg)]"></div>
      <div className="rsb-scroll flex-1 overflow-y-auto overflow-x-hidden">
        {view === 'doc' && headings.length > 0 && (
          <>
            <div className="rsb-sec flex items-center gap-1.5 px-3.5 pt-3 pb-1.75 text-[11px] font-bold text-[var(--tx2)] bg-[var(--rsb-bg)]">
              <Book size={13} /> On this page
            </div>
            {headings.map((h: any) => (
              <div 
                key={h.id} 
                className="rth flex items-start gap-2 px-4.5 py-1.75 text-[12.5px] text-[var(--tx2)] cursor-pointer border-l-2 border-transparent hover:text-[var(--P)] hover:bg-[var(--g50)] transition-all"
                onClick={() => {
                  const el = document.getElementById(`vb_${h.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                <span className="rth-dot w-1.25 h-1.25 rounded-full bg-current shrink-0 mt-1.25"></span>
                <span className="rth-lbl overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">{h.content}</span>
              </div>
            ))}
            <div className="rsb-divider h-[1px] bg-[var(--bd)] my-1.5"></div>
          </>
        )}

        {user && editHistory.length > 0 && (
          <>
            <div className="rsb-sec flex items-center gap-1.5 px-3.5 pt-3 pb-1.75 text-[11px] font-bold text-[var(--tx2)] bg-[var(--rsb-bg)]">
              <Edit size={13} /> Recently edited
            </div>
            {editHistory.map((item: any) => (
              <div key={item.id} className="rhi flex items-start gap-2.25 px-3.5 py-2.25 cursor-pointer hover:bg-[var(--g50)] transition-all" onClick={() => { setEditingDoc(documents.find((d: any) => d.id === item.id) || null); setShowEditor(true); }}>
                <div className="rhi-ico w-7 h-7 rounded-[var(--r1)] bg-[var(--P1)] text-[var(--P)] flex items-center justify-center shrink-0 mt-0.25">
                  <Edit size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="rhi-t text-[13px] font-medium text-[var(--tx)] overflow-hidden text-ellipsis whitespace-nowrap max-w-[185px] leading-tight">{item.title}</div>
                  <div className="rhi-ts text-[10px] text-[var(--g400)] mt-0.5">Edited recently</div>
                </div>
              </div>
            ))}
            <button className="rsb-clr flex items-center gap-1.25 mx-3.5 mt-1.5 mb-2 px-2.5 py-1.25 rounded-[var(--r1)] text-[12px] text-[var(--tx2)] border border-[var(--bd)] hover:bg-[var(--g100)] hover:text-[var(--tx)] transition-all" onClick={() => setEditHistory([])}>
              <X size={13} /> Clear
            </button>
            <div className="rsb-divider h-[1px] bg-[var(--bd)] my-1.5"></div>
          </>
        )}

        <div className="rsb-sec flex items-center gap-1.5 px-3.5 pt-3 pb-1.75 text-[11px] font-bold text-[var(--tx2)] bg-[var(--rsb-bg)]">
          <Clock size={13} /> Recently read
        </div>
        {readHistory.length === 0 ? (
          <div className="rsb-empty px-4 py-2.5 text-[12.5px] text-[var(--tx2)] italic leading-relaxed">No reading history yet.<br/>Open a document to start.</div>
        ) : (
          readHistory.map((item: any) => (
            <div key={item.id} className="rhi flex items-start gap-2.25 px-3.5 py-2.25 cursor-pointer hover:bg-[var(--g50)] transition-all" onClick={() => { setCurDocId(item.id); setView('doc'); }}>
              <div className="rhi-ico w-7 h-7 rounded-[var(--r1)] bg-[var(--P1)] text-[var(--P)] flex items-center justify-center shrink-0 mt-0.25">
                <FileText size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="rhi-t text-[13px] font-medium text-[var(--tx)] overflow-hidden text-ellipsis whitespace-nowrap max-w-[185px] leading-tight">{item.title}</div>
                <div className="rhi-ts text-[10px] text-[var(--g400)] mt-0.5">Read recently</div>
              </div>
            </div>
          ))
        )}
        {readHistory.length > 0 && (
          <button className="rsb-clr flex items-center gap-1.25 mx-3.5 mt-1.5 mb-2 px-2.5 py-1.25 rounded-[var(--r1)] text-[12px] text-[var(--tx2)] border border-[var(--bd)] hover:bg-[var(--g100)] hover:text-[var(--tx)] transition-all" onClick={() => setReadHistory([])}>
            <X size={13} /> Clear
          </button>
        )}
      </div>
      <div className="rsb-foot shrink-0 border-t border-[var(--bd)] p-3 bg-[var(--rsb-bg)]">
        <div className="sb-ad rounded-[var(--r2)] overflow-hidden border border-[var(--bd)] bg-[var(--card)] cursor-pointer transition-shadow hover:shadow-[var(--s2)]">
          <div className="sb-ad-body p-2.5">
            <div className="sb-ad-label text-[11px] font-semibold text-[var(--tx2)] mb-1">💡 Pro Tip</div>
            <div className="sb-ad-text text-[12px] text-[var(--tx)] leading-tight">Host Doctify on your VM — full control, no limits.</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
