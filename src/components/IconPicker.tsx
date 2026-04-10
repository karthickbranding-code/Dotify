import React, { useState } from 'react';
import { Search, X, Upload } from 'lucide-react';
import { icons } from '../constants/icons';

interface IconPickerProps {
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, onClose }) => {
  const [search, setSearch] = useState('');
  const filtered = icons.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--bd)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-[var(--bd)] flex items-center justify-between bg-[var(--g50)]">
          <h3 className="font-bold text-lg">Select Icon</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--g200)] rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 border-b border-[var(--bd)] flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tx2)]" size={18} />
            <input 
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--g50)] border border-[var(--bd)] rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Search icons..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileUpload} 
              accept="image/*" 
            />
            <button className="h-full px-4 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2 font-medium">
              <Upload size={18} />
              Upload
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 sm:grid-cols-5 gap-3 custom-scrollbar">
          {filtered.map(item => (
            <button
              key={item.name}
              onClick={() => { onChange(item.name); onClose(); }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2 group ${value === item.name ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20' : 'border-transparent hover:bg-[var(--g100)] hover:border-[var(--bd)]'}`}
            >
              <item.icon size={24} className={value === item.name ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
              <span className="text-[10px] font-medium truncate w-full text-center opacity-70">{item.name}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-[var(--tx2)]">
              No icons found for "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
