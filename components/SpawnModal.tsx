import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { Genus, Species, Subspecies, IndividualBeetle } from '../types';
import { ChevronRightIcon, CalendarDaysIcon } from './icons';

type Parent = { ind: IndividualBeetle, sub: Subspecies, species: Species, genus: Genus };

interface SpawnModalProps {
    isOpen: boolean;
    onClose: () => void;
    allGenera: Genus[];
    onSave: (payload: {
        males: Parent[];
        females: Parent[];
        spawnData: Record<string, { date: string; count: string }>;
        decision: {
            scenario: 'INTER_SPECIES' | 'INTER_LINE' | 'NORMAL';
            createNew?: boolean;
            newSpeciesName?: string;
            newLineName?: string;
        };
    }) => void;
    onOpenDatePicker: (initialDate: string, onSave: (date: string) => void) => void;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

type ConfirmationState = {
    isOpen: true;
    type: 'alert' | 'confirm';
    message: string;
    scenario?: 'INTER_SPECIES' | 'INTER_LINE';
    onConfirm?: (data?: any) => void;
    onCancel?: (data?: any) => void;
    requiresInput?: boolean;
    inputLabel?: string;
    defaultInputValue?: string;
} | { isOpen: false };

// ConfirmationDialog component is moved outside to prevent re-rendering issues causing focus loss.
const ConfirmationDialog: React.FC<{
    state: ConfirmationState;
    inputValue: string;
    setInputValue: (value: string) => void;
}> = ({ state, inputValue, setInputValue }) => {
    if (!state.isOpen) return null;

    const { message, type, scenario, onConfirm, onCancel, requiresInput, inputLabel } = state;
    const isInterLine = scenario === 'INTER_LINE';

    return (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-20 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <p className="text-gray-800 whitespace-pre-wrap">{message}</p>
                {requiresInput && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 whitespace-pre-wrap">{inputLabel}</label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="mt-1 w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900"
                            autoFocus
                        />
                    </div>
                )}
                <div className="flex justify-end space-x-2 mt-6">
                    {type === 'confirm' && (
                         <button onClick={() => onCancel?.()} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">{isInterLine ? '아니오' : '취소'}</button>
                    )}
                    <button onClick={() => onConfirm?.(inputValue)} className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90">{type === 'alert' ? '확인' : (isInterLine ? '예' : '확인')}</button>
                </div>
            </div>
        </div>
    );
};


const SpawnModal: React.FC<SpawnModalProps> = ({ isOpen, onClose, allGenera, onSave, onOpenDatePicker }) => {
    const [selectedMales, setSelectedMales] = useState<Set<string>>(new Set());
    const [selectedFemales, setSelectedFemales] = useState<Set<string>>(new Set());
    const [spawnData, setSpawnData] = useState<Record<string, { date: string, count: string }>>({});
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false });
    const [inputValue, setInputValue] = useState('');

    const allIndividuals = useMemo((): Parent[] => {
        const individuals: Parent[] = [];
        allGenera.forEach(genus =>
            genus.species.forEach(species =>
                species.subspecies.forEach(sub =>
                    sub.individuals.forEach(ind => {
                        individuals.push({ ind, sub, species, genus });
                    })
                )
            )
        );
        return individuals;
    }, [allGenera]);

    const handleSelect = (ind: IndividualBeetle) => {
        if (ind.sex === '♂') {
            const newSelection = new Set(selectedMales);
            if (newSelection.has(ind.id)) newSelection.delete(ind.id);
            else newSelection.add(ind.id);
            setSelectedMales(newSelection);
        } else if (ind.sex === '♀') {
            const newSelection = new Set(selectedFemales);
            if (newSelection.has(ind.id)) {
                newSelection.delete(ind.id);
                setSpawnData(prev => {
                    const next = {...prev};
                    delete next[ind.id];
                    return next;
                });
            } else {
                newSelection.add(ind.id);
                 setSpawnData(prev => ({ ...prev, [ind.id]: { date: getTodayDate(), count: '' } }));
            }
            setSelectedFemales(newSelection);
        }
    };

    const handleSpawnDataChange = (femaleId: string, field: 'date' | 'count', value: string) => {
        setSpawnData(prev => ({
            ...prev,
            [femaleId]: { ...prev[femaleId], [field]: value }
        }));
    };
    
    const resetState = () => {
        setSelectedMales(new Set());
        setSelectedFemales(new Set());
        setSpawnData({});
        setExpanded({});
        setConfirmation({ isOpen: false });
        setInputValue('');
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleSave = () => {
        const males = allIndividuals.filter(i => selectedMales.has(i.ind.id));
        const females = allIndividuals.filter(i => selectedFemales.has(i.ind.id));

        if (females.length === 0) {
            setConfirmation({ isOpen: true, type: 'alert', message: '최소 한 마리 이상의 암컷을 선택해야 합니다.', onConfirm: () => setConfirmation({ isOpen: false }) });
            return;
        }

        const allParents = [...males, ...females];
        const distinctGenera = new Set(allParents.map(p => p.genus.id));
        if (distinctGenera.size > 1) {
            setConfirmation({ isOpen: true, type: 'alert', message: '속이 다른 개체는 교배할 수 없습니다.', onConfirm: () => setConfirmation({ isOpen: false }) });
            return;
        }

        const distinctSpecies = new Set(allParents.map(p => p.species.id));
        if (distinctSpecies.size > 1) {
            const maleSpeciesName = males[0]?.species.name || 'Unknown';
            const femaleSpeciesName = females[0]?.species.name || 'Unknown';
            const newSpeciesName = `${maleSpeciesName} x ${femaleSpeciesName}`;
            
            setInputValue(newSpeciesName); // Set default value for the new line name
            setConfirmation({
                isOpen: true,
                type: 'confirm',
                scenario: 'INTER_SPECIES',
                message: "종이 다른 개체의 교배는 생식 장애나 유전적 문제가 생길 수 있습니다. 정말 진행하시겠습니까?",
                inputLabel: "새로운 종이 생성됩니다.\n새로운 라인(아종)의 이름을 입력해주세요.",
                onConfirm: (lineName) => {
                    if (lineName) {
                        onSave({ males, females, spawnData, decision: { scenario: 'INTER_SPECIES', createNew: true, newSpeciesName, newLineName: lineName } });
                        handleClose();
                    }
                },
                onCancel: () => setConfirmation({ isOpen: false }),
                requiresInput: true,
            });
            return;
        }
        
        const distinctSubspecies = new Set(allParents.map(p => p.sub.id));
        if (distinctSubspecies.size > 1) {
            const maleLineName = males[0]?.sub.name || 'Unknown';
            const femaleLineName = females[0]?.sub.name || 'Unknown';
            const newLineName = `${maleLineName} x ${femaleLineName}`;
            setConfirmation({
                isOpen: true,
                type: 'confirm',
                scenario: 'INTER_LINE',
                message: "새로운 라인을 만들어 드릴까요?",
                onConfirm: () => {
                    onSave({ males, females, spawnData, decision: { scenario: 'INTER_LINE', createNew: true, newLineName } });
                    handleClose();
                },
                onCancel: () => {
                    onSave({ males, females, spawnData, decision: { scenario: 'INTER_LINE', createNew: false } });
                    handleClose();
                }
            });
            return;
        }

        onSave({ males, females, spawnData, decision: { scenario: 'NORMAL' } });
        handleClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="산란 기록">
            <div className="relative">
                <ConfirmationDialog state={confirmation} inputValue={inputValue} setInputValue={setInputValue} />
                <div className={`flex space-x-4 h-[60vh] ${confirmation.isOpen ? 'filter blur-sm' : ''}`}>
                    <div className="w-1/2 border rounded-lg p-2 overflow-y-auto">
                        <h3 className="font-semibold p-2 sticky top-0 bg-gray-50 z-10">종충 선택</h3>
                        {allGenera.map(genus => (
                            <div key={genus.id}>
                                <h4 className="font-bold text-lg p-2">{genus.name}</h4>
                                {genus.species.map(species => (
                                    <div key={species.id} className="pl-2">
                                        <h5 className="font-semibold p-2 cursor-pointer flex items-center" onClick={() => setExpanded(p => ({...p, [species.id]: !p[species.id]}))}>
                                          <ChevronRightIcon className={`w-4 h-4 mr-1 transition-transform ${expanded[species.id] ? 'rotate-90' : ''}`}/>
                                          {species.name}
                                        </h5>
                                        {expanded[species.id] && species.subspecies.map(sub => (
                                             <div key={sub.id} className="pl-4">
                                                <p className="p-2 text-sm text-gray-600">{sub.name}</p>
                                                <ul className="pl-4">
                                                    {sub.individuals.map(ind => (
                                                        <li key={ind.id} className="flex items-center space-x-2 py-1">
                                                            <input type="checkbox" id={`cb-${ind.id}`}
                                                                checked={selectedMales.has(ind.id) || selectedFemales.has(ind.id)}
                                                                onChange={() => handleSelect(ind)}
                                                                disabled={ind.sex === '미구분'}
                                                            />
                                                            <label htmlFor={`cb-${ind.id}`} className="text-sm">
                                                              {ind.sex} {ind.managementNumber} ({ind.generation})
                                                            </label>
                                                        </li>
                                                    ))}
                                                </ul>
                                             </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="w-1/2 border rounded-lg p-2 overflow-y-auto">
                         <h3 className="font-semibold p-2 sticky top-0 bg-gray-50 z-10">산란 정보 입력</h3>
                         <div className="space-y-4 p-2">
                            {allIndividuals.filter(i => selectedFemales.has(i.ind.id)).map(female => (
                                <div key={female.ind.id} className="p-3 bg-blue-50 rounded-md border">
                                    <p className="font-semibold text-blue-800">♀ {female.sub.name} {female.ind.managementNumber}</p>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div>
                                            <label className="text-xs">산란일</label>
                                            <div className="mt-1 flex items-center justify-between p-1 border rounded bg-white">
                                                <span className="text-xs flex-grow pl-1">{spawnData[female.ind.id]?.date || ''}</span>
                                                <button
                                                    onClick={() => onOpenDatePicker(
                                                        spawnData[female.ind.id]?.date || getTodayDate(),
                                                        (newDate) => handleSpawnDataChange(female.ind.id, 'date', newDate)
                                                    )}
                                                    className="p-1 rounded hover:bg-gray-200 cursor-pointer"
                                                >
                                                    <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </div>
                                        </div>
                                         <div>
                                            <label className="text-xs">산란 두수</label>
                                            <input type="number" value={spawnData[female.ind.id]?.count || ''} onChange={e => handleSpawnDataChange(female.ind.id, 'count', e.target.value)} className="w-full p-1 text-xs border rounded bg-white" placeholder="숫자"/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {selectedFemales.size === 0 && <p className="text-center text-gray-500 py-8">암컷을 선택해주세요.</p>}
                         </div>
                    </div>
                </div>
                <div className={`flex justify-end space-x-2 mt-4 ${confirmation.isOpen ? 'filter blur-sm' : ''}`}>
                    <button type="button" onClick={handleClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">취소</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90">저장</button>
                </div>
            </div>
        </Modal>
    );
};

export default SpawnModal;