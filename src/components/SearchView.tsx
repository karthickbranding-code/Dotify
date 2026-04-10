import React from 'react';
import { Search } from 'lucide-react';
import { useDoc } from '../contexts/DocContext';
import { Badge } from './ui/Badge';

export const SearchView: React.FC = () => {
  const { filteredDocuments, searchQuery, setCurDocId, setView, pushRead, categories } = useDoc();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Search Results</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Found {filteredDocuments.length} results for "{searchQuery}"
        </p>
      </div>
      <div className="space-y-4">
        {filteredDocuments.map(d => {
          const cat = categories.find(c => c.id === d.categoryId);
          return (
            <div 
              key={d.id} 
              onClick={() => { setCurDocId(d.id); setView('doc'); pushRead(d.id); }}
              className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-center gap-2">
                <Badge variant="blue">{cat?.name || 'Uncategorized'}</Badge>
                <h3 className="text-xl font-semibold">{d.title}</h3>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">
                {d.blocks.find(b => b.type === 'text')?.content || 'No preview available.'}
              </p>
            </div>
          );
        })}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl">
            <Search className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium">No results found</h3>
            <p className="text-gray-500">Try different keywords or check your spelling.</p>
          </div>
        )}
      </div>
    </div>
  );
};
