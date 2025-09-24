import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { fullTaxonomy } from '../data/beetleTaxonomy';

interface TaxonomySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: { genus: string; species: string; subspecies: string }) => void;
}

const TaxonomySearchModal: React.FC<TaxonomySearchModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const results: { genus: string; species: string; subspecies: string; full: string }[] = [];
    const lowerCaseSearch = searchTerm.toLowerCase();

    fullTaxonomy.forEach(genusData => {
      genusData.species.forEach(speciesData => {
        speciesData.subspecies.forEach(subspeciesName => {
          if (subspeciesName.toLowerCase().includes(lowerCaseSearch)) {
            results.push({
              genus: genusData.genus,
              species: speciesData.species,
              subspecies: subspeciesName,
              full: `${genusData.genus} ${speciesData.species} ${subspeciesName}`,
            });
          }
        });
      });
    });

    return results;
  }, [searchTerm]);

  const handleSelect = (result: { genus: string; species: string; subspecies: string }) => {
    onSelect(result);
    setSearchTerm('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="학명 검색하여 추가">
      <div className="space-y-4">
        <div>
          <label htmlFor="taxonomy-search" className="block text-sm font-medium text-gray-700">
            아종(亜種) 또는 라인명 검색
          </label>
          <input
            type="text"
            id="taxonomy-search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mt-1 w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900"
            placeholder="예: yasuokai, palawanicus..."
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto border rounded-lg bg-gray-50 p-2">
          {searchTerm && searchResults.length === 0 && (
            <p className="text-center text-gray-500 py-4">검색 결과가 없습니다.</p>
          )}
          <ul className="space-y-1">
            {searchResults.map((result, index) => (
              <li
                key={index}
                onClick={() => handleSelect(result)}
                className="p-2 rounded-md hover:bg-primary/20 cursor-pointer text-text-primary"
              >
                <span className="font-semibold">{result.genus}</span>
                <span className="italic"> {result.species}</span>
                <span className="font-medium"> {result.subspecies}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TaxonomySearchModal;