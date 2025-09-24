import React, { useState } from 'react';
import { Genus, Species, Subspecies } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ChevronRightIcon, FolderIcon, DocumentIcon } from './icons';

type SelectedItem = { type: string; id: string; } | null;

interface SidebarProps {
  data: Genus[];
  selectedItem: SelectedItem;
  onSelectItem: (type: 'genus' | 'species' | 'subspecies', id: string, parentIds?: { genusId?: string, speciesId?: string }) => void;
  onAdd: (type: 'genus' | 'species' | 'subspecies', parentId?: string, parentGenusId?: string) => void;
  onEdit: (type: 'genus' | 'species' | 'subspecies', item: Genus | Species | Subspecies, parentIds?: { genusId?: string, speciesId?: string }) => void;
  onDelete: (type: 'genus' | 'species' | 'subspecies', item: Genus | Species | Subspecies, parentIds?: { genusId?: string, speciesId?: string }) => void;
  onOpenTaxonomySearch: () => void; // New prop
}

const ActionButtons: React.FC<{
    onAdd?: (e: React.MouseEvent) => void,
    onEdit: (e: React.MouseEvent) => void,
    onDelete: (e: React.MouseEvent) => void,
}> = ({ onAdd, onEdit, onDelete }) => (
    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {onAdd && <button onClick={onAdd} className="p-1 rounded hover:bg-green-100 text-green-600"><PlusIcon /></button>}
        <button onClick={onEdit} className="p-1 rounded hover:bg-yellow-100 text-yellow-600"><PencilIcon /></button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-100 text-red-600"><TrashIcon /></button>
    </div>
);

const Sidebar: React.FC<SidebarProps> = ({ data, selectedItem, onSelectItem, onAdd, onEdit, onDelete, onOpenTaxonomySearch }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isSelected = (type: string, id: string) => selectedItem?.type === type && selectedItem?.id === id;

  return (
    <div className="w-1/3 max-w-xs h-full bg-surface shadow-lg overflow-y-auto p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-text-primary">분류</h2>
            <div className="flex items-center space-x-2">
                <button 
                    onClick={onOpenTaxonomySearch}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow text-sm"
                >
                    <span>학명 검색 추가</span>
                </button>
                <button 
                    onClick={() => onAdd('genus')}
                    className="flex items-center space-x-2 bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors shadow"
                    title="속 추가"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
        <nav className="flex-grow">
            <ul>
                {data.map(genus => (
                    <li key={genus.id} className="my-1">
                        <div className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${isSelected('genus', genus.id) ? 'bg-primary/20' : 'hover:bg-gray-100'}`}>
                            <div className="flex items-center" onClick={() => toggleExpand(genus.id)}>
                                <ChevronRightIcon className={`w-5 h-5 text-secondary mr-1 transition-transform ${expanded[genus.id] ? 'rotate-90' : ''}`} />
                                <FolderIcon className="w-5 h-5 text-yellow-600 mr-2" />
                                <span className="font-semibold text-text-primary">{genus.name}</span>
                            </div>
                            <ActionButtons 
                                onAdd={(e) => { e.stopPropagation(); onAdd('species', genus.id) }}
                                onEdit={(e) => { e.stopPropagation(); onEdit('genus', genus) }}
                                onDelete={(e) => { e.stopPropagation(); onDelete('genus', genus) }}
                            />
                        </div>
                        {expanded[genus.id] && (
                            <ul className="pl-6 border-l-2 border-gray-200 ml-3">
                                {genus.species.map(species => (
                                    <li key={species.id} className="my-1">
                                        <div className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${isSelected('species', species.id) ? 'bg-primary/20' : 'hover:bg-gray-100'}`}>
                                            <div className="flex items-center" onClick={() => toggleExpand(species.id)}>
                                                <ChevronRightIcon className={`w-5 h-5 text-secondary mr-1 transition-transform ${expanded[species.id] ? 'rotate-90' : ''}`} />
                                                <DocumentIcon className="w-5 h-5 text-blue-600 mr-2" />
                                                <span className="text-text-secondary">{species.name}</span>
                                            </div>
                                            <ActionButtons 
                                                onAdd={(e) => { e.stopPropagation(); onAdd('subspecies', species.id, genus.id) }}
                                                onEdit={(e) => { e.stopPropagation(); onEdit('species', species, { genusId: genus.id }) }}
                                                onDelete={(e) => { e.stopPropagation(); onDelete('species', species, { genusId: genus.id }) }}
                                            />
                                        </div>
                                        {expanded[species.id] && (
                                            <ul className="pl-6 border-l-2 border-gray-200 ml-3">
                                                {species.subspecies.map(sub => (
                                                    <li key={sub.id} className="my-1">
                                                        <div 
                                                            onClick={() => onSelectItem('subspecies', sub.id, { genusId: genus.id, speciesId: species.id })}
                                                            className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${isSelected('subspecies', sub.id) ? 'bg-primary/20' : 'hover:bg-gray-100'}`}
                                                        >
                                                            <div className="flex items-center">
                                                              <span className="text-gray-400 mr-3">-</span>
                                                              <span className="text-text-secondary">{sub.name}</span>
                                                            </div>
                                                            <ActionButtons 
                                                                onEdit={(e) => { e.stopPropagation(); onEdit('subspecies', sub, { genusId: genus.id, speciesId: species.id }) }}
                                                                onDelete={(e) => { e.stopPropagation(); onDelete('subspecies', sub, { genusId: genus.id, speciesId: species.id }) }}
                                                            />
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    </div>
  );
};

export default Sidebar;