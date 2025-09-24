import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { IndividualBeetle, LifecycleEvent } from '../types';
import { CalendarDaysIcon } from './icons';

interface BatchUpdateModalsProps {
    isOpen: boolean;
    eventType: LifecycleEvent | null;
    selectedIndividuals: IndividualBeetle[];
    onClose: () => void;
    onSave: (updates: any[]) => void;
    onOpenDatePicker: (initialDate: string, onSave: (date: string) => void) => void;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

const eventTitles: Record<LifecycleEvent, string> = {
    bottleChange: '유충 병갈이 일괄 기록',
    pupa: '용화일 일괄 입력',
    hatch: '우화일 일괄 입력',
    feed: '후식 시작일 일괄 입력',
    larvaHatch: '부화일 일괄 입력',
    spawn: '산란 기록', // This will be unused but kept for type consistency
    createNewLine: '새로운 라인 만들기',
};

const inputStyles = "w-full p-1 border rounded bg-white text-gray-900 text-xs";

const BatchUpdateModals: React.FC<BatchUpdateModalsProps> = ({ isOpen, eventType, selectedIndividuals, onClose, onSave, onOpenDatePicker }) => {
    const [updates, setUpdates] = useState<Record<string, any>>({});
    
    useEffect(() => {
        if (!isOpen || !eventType) return;
        
        const initialUpdates: Record<string, any> = {};
        const today = getTodayDate();

        selectedIndividuals.forEach(ind => {
            switch (eventType) {
                case 'bottleChange':
                    initialUpdates[ind.id] = { date: today, weight: '', headWidth: ind.headWidth || '' };
                    break;
                case 'createNewLine':
                    initialUpdates[ind.id] = {};
                    break;
                // 'spawn' is handled in its own modal now.
                default:
                    initialUpdates[ind.id] = { date: today };
                    break;
            }
        });
        setUpdates(initialUpdates);
    }, [isOpen, eventType, selectedIndividuals]);

    if (!isOpen || !eventType || eventType === 'spawn' || selectedIndividuals.length === 0) return null;

    const handleInputChange = (id: string, field: string, value: string) => {
        setUpdates(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const handleSave = () => {
        const updatesArray = Object.entries(updates).map(([id, data]) => ({ id, ...data }));
        onSave(updatesArray);
    };

    const renderHeaders = () => {
        const headerClass = "px-2 py-2 text-left";
        const baseHeaders = [<th key="num" className="px-2 py-2 text-left">관리번호</th>];
        switch (eventType) {
            case 'bottleChange':
                return [...baseHeaders, <th key="date" className={headerClass}>날짜</th>, <th key="weight" className={headerClass}>무게(g)</th>, <th key="head" className={headerClass}>두폭(mm)</th>];
            case 'pupa':
            case 'hatch':
            case 'feed':
            case 'larvaHatch':
                return [...baseHeaders, <th key="date" className={headerClass}>날짜</th>];
            case 'createNewLine':
                return baseHeaders;
            default:
                return baseHeaders;
        }
    };

    const DateInputCell: React.FC<{ individualId: string; dateValue: string }> = ({ individualId, dateValue }) => {
        const handleDateChange = (newDate: string) => {
            handleInputChange(individualId, 'date', newDate);
        };

        return (
            <td className="px-2 py-1">
                <div className="flex items-center justify-between">
                    <span className="text-xs flex-grow">{dateValue || ''}</span>
                     <button
                        onClick={() => onOpenDatePicker(dateValue, handleDateChange)}
                        className="p-1 rounded hover:bg-gray-200 cursor-pointer"
                    >
                        <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </td>
        );
    };

    const renderRow = (ind: IndividualBeetle) => {
        const currentUpdate = updates[ind.id] || {};
        const baseCell = <td key="num" className="px-2 py-1 font-semibold">{ind.managementNumber}</td>;
        
        switch (eventType) {
            case 'bottleChange':
                return (
                    <tr key={ind.id} className="border-b">
                        {baseCell}
                        <DateInputCell individualId={ind.id} dateValue={currentUpdate.date || ''} />
                        <td className="px-2 py-1"><input type="text" value={currentUpdate.weight || ''} onChange={e => handleInputChange(ind.id, 'weight', e.target.value)} className={inputStyles} placeholder="g"/></td>
                        <td className="px-2 py-1"><input type="text" value={currentUpdate.headWidth || ''} onChange={e => handleInputChange(ind.id, 'headWidth', e.target.value)} className={inputStyles} placeholder="mm"/></td>
                    </tr>
                );
            case 'pupa':
            case 'hatch':
            case 'feed':
            case 'larvaHatch':
                return (
                     <tr key={ind.id} className="border-b">
                        {baseCell}
                        <DateInputCell individualId={ind.id} dateValue={currentUpdate.date || ''} />
                    </tr>
                );
            case 'createNewLine':
                return (
                    <tr key={ind.id} className="border-b">
                        {baseCell}
                    </tr>
                );
            default:
                return null;
        }
    };
    
    const bodyRows = selectedIndividuals.map(renderRow).filter(Boolean);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={eventTitles[eventType]}>
            <div className="space-y-4">
                 <div className="max-h-80 overflow-auto border rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0 text-xs text-left">
                           <tr>{renderHeaders()}</tr>
                        </thead>
                        <tbody className="bg-white">
                            {bodyRows.length > 0 ? bodyRows : (
                                <tr>
                                    <td colSpan={renderHeaders().length} className="text-center py-4 text-gray-500">
                                        선택된 개체가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">취소</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90">일괄 저장</button>
                </div>
            </div>
        </Modal>
    );
};

export default BatchUpdateModals;