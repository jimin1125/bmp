import React, { useState, useMemo } from 'react';
import { Subspecies, IndividualBeetle, LifecycleEvent } from '../types';
import { PlusIcon, TrashIcon, CalendarDaysIcon } from './icons';

interface DataTableProps {
  subspecies: Subspecies | null;
  onUpdateIndividual: (subspeciesId: string, individual: IndividualBeetle) => void;
  onAddIndividual: (subspeciesId: string) => void;
  onDeleteIndividual: (subspeciesId: string, individualId: string) => void;
  onOpenLarvaHistoryModal: (individual: IndividualBeetle, subspeciesId: string, subspeciesName: string) => void;
  onOpenImageModal: (individual: IndividualBeetle, subspeciesId: string) => void;
  onOpenDatePicker: (initialDate: string, onSave: (date: string) => void) => void;
  saleCreationState: { active: boolean; selectedIds: Set<string> };
  onToggleSaleMode: () => void;
  onSelectForSale: (individualId: string) => void;
  onFinalizeSalePost: () => void;
  lifecycleEventState: { active: boolean, selectedIds: Set<string>, eventType: LifecycleEvent | null };
  onStartLifecycleEvent: (eventType: LifecycleEvent, payload?: any) => void;
  onSelectForLifecycleEvent: (individualId: string) => void;
  onFinalizeLifecycleSelection: () => void;
  onCancelLifecycleEvent: () => void;
}

type SortableKeys = 
    | 'managementNumber'
    | 'generation'
    | 'sex'
    | 'parentInfo'
    | 'hatchDate'
    | 'pupaDate'
    | 'headWidth'
    | 'lastWeight' // New sort key
    | 'nextBottleChangeDate'
    | 'notes';

const DataTable: React.FC<DataTableProps> = ({ 
    subspecies, 
    onUpdateIndividual, 
    onAddIndividual, 
    onDeleteIndividual, 
    onOpenLarvaHistoryModal,
    onOpenImageModal,
    onOpenDatePicker,
    saleCreationState,
    onToggleSaleMode,
    onSelectForSale,
    onFinalizeSalePost,
    lifecycleEventState,
    onStartLifecycleEvent,
    onSelectForLifecycleEvent,
    onFinalizeLifecycleSelection,
    onCancelLifecycleEvent,
}) => {
  const [isLifecycleMenuOpen, setLifecycleMenuOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'managementNumber', direction: 'ascending'});
  
  const selectionModeActive = saleCreationState.active || lifecycleEventState.active;

  const individualsWithLastWeight = useMemo(() => {
    if (!subspecies) return [];
    return subspecies.individuals.map(ind => {
      const sortedHistory = [...ind.larvaHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return {
        ...ind,
        lastWeight: sortedHistory.length > 0 ? parseFloat(sortedHistory[0].weight) : 0,
      };
    });
  }, [subspecies]);

  const sortedIndividuals = useMemo(() => {
    if (!subspecies) return [];
    let sortableItems = [...individualsWithLastWeight];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            const { key, direction } = sortConfig;
            const valA = a[key as keyof typeof a] ?? '';
            const valB = b[key as keyof typeof b] ?? '';
            let comparison = 0;

            switch (key) {
                case 'generation':
                    comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
                    break;
                case 'hatchDate':
                case 'pupaDate':
                case 'nextBottleChangeDate':
                    const timeA = valA ? new Date(valA as string).getTime() : 0;
                    const timeB = valB ? new Date(valB as string).getTime() : 0;
                    comparison = timeA - timeB;
                    break;
                case 'managementNumber':
                case 'headWidth':
                case 'lastWeight':
                    const numA = parseFloat(String(valA)) || 0;
                    const numB = parseFloat(String(valB)) || 0;
                    comparison = numA - numB;
                    break;
                default:
                    comparison = String(valA).localeCompare(String(valB));
                    break;
            }
            
            return direction === 'ascending' ? comparison : -comparison;
        });
    }
    return sortableItems;
  }, [individualsWithLastWeight, sortConfig, subspecies]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  if (!subspecies) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50">
        <h3 className="text-2xl font-bold text-gray-700">사육 개체 관리</h3>
        <p className="mt-2 text-gray-500">왼쪽 메뉴에서 관리할 아종/라인을 선택해주세요.</p>
        <div className="mt-6 text-5xl text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
      </div>
    );
  }

  const handleInputChange = (individualId: string, field: keyof Omit<IndividualBeetle, 'larvaHistory' | 'id' | 'imageUrls'>, value: string | '♂' | '♀' | '미구분') => {
    const individual = subspecies.individuals.find(ind => ind.id === individualId);
    if (individual) {
      onUpdateIndividual(subspecies.id, { ...individual, [field]: value });
    }
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateString) < today;
  };
  
  const lifecycleEvents: { key: LifecycleEvent; label: string }[] = [
    { key: 'bottleChange', label: '병갈이' },
    { key: 'pupa', label: '용화' },
    { key: 'hatch', label: '우화' },
    { key: 'feed', label: '후식 시작' },
    { key: 'larvaHatch', label: '부화' },
    { key: 'spawn', label: '산란 기록' },
    { key: 'createNewLine', label: '새로운 라인 만들기' },
  ];
  
  const TableHeader: React.FC<{ sortKey: SortableKeys, className?: string, children: React.ReactNode }> = ({ sortKey, className, children }) => (
    <th scope="col" className={`px-2 py-3 ${className || ''}`}>
        <button onClick={() => requestSort(sortKey)} className="flex items-center space-x-1 font-bold">
            <span>{children}</span>
            <span className="text-xs w-3">{getSortIndicator(sortKey)}</span>
        </button>
    </th>
  );
  
  const inputStyles = "w-full p-1.5 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900 text-xs";

  const DateCell: React.FC<{ individual: IndividualBeetle, field: 'hatchDate' | 'pupaDate' }> = ({ individual, field }) => {
    const currentDate = individual[field] || '';
    
    const handleDateChange = (newDate: string) => {
        handleInputChange(individual.id, field, newDate);
    };

    return (
      <div className="flex items-center justify-between p-1.5 border border-transparent">
        <span className="text-xs flex-grow">{currentDate}</span>
        <button
          onClick={() => onOpenDatePicker(currentDate, handleDateChange)}
          className="p-1 rounded hover:bg-gray-200 cursor-pointer"
        >
          <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    );
  };
  
  const GenerationCell: React.FC<{ individual: IndividualBeetle }> = ({ individual }) => {
      const genString = individual.generation || '';
      const prefixMatch = genString.match(/^[A-Z]+/i);
      const numberMatch = genString.match(/\d+$/);
      
      const prefix = prefixMatch ? prefixMatch[0].toUpperCase() : 'CBF';
      const number = numberMatch ? numberMatch[0] : '';

      const handleGenChange = (newPrefix: string, newNumber: string) => {
        const num = parseInt(newNumber, 10);
        const finalNumber = !isNaN(num) && num > 0 ? num : '';
        handleInputChange(individual.id, 'generation', `${newPrefix}${finalNumber}`);
      };

      return (
        <div className="flex items-center space-x-1">
          <select 
            value={prefix} 
            onChange={e => handleGenChange(e.target.value, number)}
            className="p-1.5 border border-gray-200 rounded bg-white text-gray-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option>CBF</option>
            <option>WF</option>
          </select>
          <input 
            type="number" 
            value={number} 
            onChange={e => handleGenChange(prefix, e.target.value)}
            className={`${inputStyles} w-12 text-center`}
            min="1"
            placeholder="F"
          />
        </div>
      );
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-gray-50 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-text-primary">{subspecies.name} 개체 목록</h3>
        <div className="flex items-center space-x-2">
            {selectionModeActive && (
                 <div className="flex items-center space-x-2">
                     <button 
                        onClick={onCancelLifecycleEvent}
                        className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors shadow"
                     >
                        <span>취소</span>
                    </button>
                    <button 
                        onClick={saleCreationState.active ? onFinalizeSalePost : onFinalizeLifecycleSelection}
                        disabled={(saleCreationState.active ? saleCreationState.selectedIds.size : lifecycleEventState.selectedIds.size) === 0}
                        className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow disabled:bg-gray-400 disabled:cursor-not-allowed"
                     >
                        <span>선택 완료</span>
                    </button>
                </div>
            )}
            {!selectionModeActive && <>
              <button 
                  onClick={onToggleSaleMode}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow"
              >
                  <span>{saleCreationState.active ? '취소' : '판매글 작성'}</span>
              </button>
              <div className="relative">
                  <button 
                      onClick={() => setLifecycleMenuOpen(prev => !prev)}
                      className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors shadow"
                  >
                      <span>충일 관리</span>
                  </button>
                  {isLifecycleMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                          {lifecycleEvents.map(event => (
                              <button 
                                  key={event.key}
                                  onClick={() => {
                                      onStartLifecycleEvent(event.key);
                                      setLifecycleMenuOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                  {event.label}
                              </button>
                          ))}
                      </div>
                  )}
              </div>
              <button 
                onClick={() => onAddIndividual(subspecies.id)}
                className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow"
              >
                <PlusIcon />
                <span>개체 추가</span>
              </button>
            </>}
        </div>
      </div>
      <div className="flex-1 overflow-auto shadow-md rounded-lg border">
        <table className="min-w-full text-sm text-left text-gray-500 table-fixed">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
            <tr>
              {selectionModeActive && <th scope="col" className="p-2 w-10"></th>}
              <th scope="col" className="p-2 w-20">이미지</th>
              <TableHeader sortKey="managementNumber" className="w-12">관리번호</TableHeader>
              <TableHeader sortKey="generation" className="w-20">누대</TableHeader>
              <TableHeader sortKey="sex" className="w-20">성별</TableHeader>
              <TableHeader sortKey="parentInfo" className="w-[35rem]">부모 정보</TableHeader>
              <TableHeader sortKey="hatchDate" className="w-24">우화일</TableHeader>
              <TableHeader sortKey="pupaDate" className="w-24">용화일</TableHeader>
              <TableHeader sortKey="headWidth" className="w-20">3령 두폭</TableHeader>
              <TableHeader sortKey="lastWeight" className="w-20">마지막 무게</TableHeader>
              <TableHeader sortKey="nextBottleChangeDate" className="w-28">다음 병갈이</TableHeader>
              <th scope="col" className="px-2 py-3 w-28">유충 관리</th>
              <TableHeader sortKey="notes" className="w-36">비고</TableHeader>
              <th scope="col" className="px-2 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {sortedIndividuals.map(individual => (
              <tr key={individual.id} className="border-b hover:bg-gray-50 align-top">
                {selectionModeActive && (
                  <td className="p-2 text-center">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                      checked={saleCreationState.active ? saleCreationState.selectedIds.has(individual.id) : lifecycleEventState.selectedIds.has(individual.id)}
                      onChange={() => saleCreationState.active ? onSelectForSale(individual.id) : onSelectForLifecycleEvent(individual.id)}
                    />
                  </td>
                )}
                <td className="p-2">
                  <div 
                    className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200"
                    onClick={() => onOpenImageModal(individual, subspecies.id)}
                  >
                    {individual.imageUrls && individual.imageUrls[0] ? (
                      <img src={individual.imageUrls[0]} alt="beetle" className="w-full h-full object-cover rounded" />
                    ) : (
                      <span className="text-xs text-gray-400">사진 없음</span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2.5"><input type="text" value={individual.managementNumber} onChange={e => handleInputChange(individual.id, 'managementNumber', e.target.value)} className={inputStyles}/></td>
                <td className="px-2 py-2.5"><GenerationCell individual={individual} /></td>
                <td className="px-2 py-2.5">
                  <select value={individual.sex} onChange={e => handleInputChange(individual.id, 'sex', e.target.value as '♂' | '♀' | '미구분')} className={inputStyles}>
                    <option value="미구분">미구분</option><option value="♂">♂</option><option value="♀">♀</option>
                  </select>
                </td>
                <td className="px-2 py-2.5"><input type="text" value={individual.parentInfo} onChange={e => handleInputChange(individual.id, 'parentInfo', e.target.value)} className={inputStyles}/></td>
                <td className="px-2 py-2.5"><DateCell individual={individual} field="hatchDate" /></td>
                <td className="px-2 py-2.5"><DateCell individual={individual} field="pupaDate" /></td>
                <td className="px-2 py-2.5"><input type="text" value={individual.headWidth} onChange={e => handleInputChange(individual.id, 'headWidth', e.target.value)} className={inputStyles}/></td>
                <td className="px-2 py-2.5 text-xs">{individual.lastWeight > 0 ? `${individual.lastWeight}g` : '-'}</td>
                <td className={`px-2 py-2.5 text-xs ${isOverdue(individual.nextBottleChangeDate) ? 'text-red-500 font-bold' : ''}`}>{individual.nextBottleChangeDate || '-'}</td>
                <td className="px-2 py-2.5 text-center">
                    <button onClick={() => onOpenLarvaHistoryModal(individual, subspecies.id, subspecies.name)} className="text-primary hover:underline text-xs">기록 관리</button>
                </td>
                <td className="px-2 py-2.5"><input type="text" value={individual.notes} onChange={e => handleInputChange(individual.id, 'notes', e.target.value)} className={inputStyles}/></td>
                <td className="px-2 py-2.5 text-center">
                  <button onClick={() => onDeleteIndividual(subspecies.id, individual.id)} className="p-1 text-red-500 hover:text-red-700">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;