import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, Italic, List, ListOrdered, Quote, 
  Undo, Redo, Code, Link as LinkIcon, Image as ImageIcon, X 
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (val: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL (use #vb_ID for internal links)', previousUrl);
    
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--bd)] bg-[var(--g50)] rounded-t-xl">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-[var(--g200)] ${editor.isActive('bold') ? 'bg-[var(--P1)] text-[var(--P)]' : ''}`}><Bold size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-[var(--g200)] ${editor.isActive('italic') ? 'bg-[var(--P1)] text-[var(--P)]' : ''}`}><Italic size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleCode().run()} className={`p-1.5 rounded hover:bg-[var(--g200)] ${editor.isActive('code') ? 'bg-[var(--P1)] text-[var(--P)]' : ''}`}><Code size={16} /></button>
      <div className="w-[1px] h-4 bg-[var(--bd)] mx-1"></div>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded hover:bg-[var(--g200)] ${editor.isActive('bulletList') ? 'bg-[var(--P1)] text-[var(--P)]' : ''}`}><List size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded hover:bg-[var(--g200)] ${editor.isActive('orderedList') ? 'bg-[var(--P1)] text-[var(--P)]' : ''}`}><ListOrdered size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded hover:bg-[var(--g200)] ${editor.isActive('blockquote') ? 'bg-[var(--P1)] text-[var(--P)]' : ''}`}><Quote size={16} /></button>
      <div className="w-[1px] h-4 bg-[var(--bd)] mx-1"></div>
      <button 
        onClick={addLink} 
        className={`p-1.5 rounded hover:bg-[var(--g200)] ${editor.isActive('link') ? 'bg-[var(--P1)] text-[var(--P)]' : ''}`}
        title="Add Link"
      >
        <LinkIcon size={16} />
      </button>
      {editor.isActive('link') && (
        <button 
          onClick={() => editor.chain().focus().unsetLink().run()} 
          className="p-1.5 rounded hover:bg-red-50 text-red-500"
          title="Remove Link"
        >
          <X size={16} />
        </button>
      )}
      <div className="w-[1px] h-4 bg-[var(--bd)] mx-1"></div>
      <button onClick={() => editor.chain().focus().undo().run()} className="p-1.5 rounded hover:bg-[var(--g200)]"><Undo size={16} /></button>
      <button onClick={() => editor.chain().focus().redo().run()} className="p-1.5 rounded hover:bg-[var(--g200)]"><Redo size={16} /></button>
    </div>
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ 
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Placeholder.configure({ placeholder: 'Start typing your content...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border border-[var(--bd)] rounded-xl bg-white dark:bg-gray-900 overflow-hidden focus-within:border-[var(--P4)] transition-all">
      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="p-4 min-h-[150px] prose dark:prose-invert max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none [&_.ProseMirror]:ring-0" 
      />
    </div>
  );
};
