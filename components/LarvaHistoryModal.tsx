import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { IndividualBeetle, LarvaHistoryEntry } from '../types';
import { PlusIcon, TrashIcon, CalendarDaysIcon } from './icons';

interface LarvaHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalData: {
    individual: IndividualBeetle;
    subspeciesId: string;
    subspeciesName: string;
  } | null;
  onSave: (subspeciesId: string, individualId: string, newHistory: LarvaHistoryEntry[]) => void;
  onOpenDatePicker: (initialDate: string, onSave: (date: string) => void) => void;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

const LarvaHistoryModal: React.FC<LarvaHistoryModalProps> = ({ isOpen, onClose, modalData, onSave, onOpenDatePicker }) => {
  const [history, setHistory] = useState<LarvaHistoryEntry[]>([]);
  const [newDate, setNewDate] = useState(getTodayDate());
  const [newWeight, setNewWeight] = useState('');

  useEffect(() => {
    if (modalData) {
      setHistory(modalData.individual.larvaHistory);
    } else {
      setHistory([]);
    }
    setNewDate(getTodayDate());
    setNewWeight('');
  }, [modalData]);

  if (!isOpen || !modalData) return null;

  const { individual, subspeciesId, subspeciesName } = modalData;

  const handleAddEntry = () => {
    if (newDate && newWeight) {
      const newEntry: LarvaHistoryEntry = {
        id: Date.now().toString(),
        date: newDate,
        weight: newWeight,
      };
      setHistory([...history, newEntry]);
      setNewDate(getTodayDate());
      setNewWeight('');
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    setHistory(history.filter(entry => entry.id !== entryId));
  };

  const handleSave = () => {
    onSave(subspeciesId, individual.id, history);
  };
  
  const title = `${subspeciesName} - ${individual.managementNumber || '개체'} 유충 기록`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="max-h-60 overflow-y-auto border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
              <tr>
                <th scope="col" className="px-4 py-2">날짜</th>
                <th scope="col" className="px-4 py-2">무게(g)</th>
                <th scope="col" className="px-4 py-2 text-right">삭제</th>
              </tr>
            </thead>
            <tbody>
              {history.map(entry => (
                <tr key={entry.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{entry.date}</td>
                  <td className="px-4 py-2">{entry.weight}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => handleDeleteEntry(entry.id)} className="p-1 text-red-500 hover:text-red-700">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-4 text-gray-400">기록이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
          <h4 className="font-semibold">새 기록 추가</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">날짜</label>
               <div className="mt-1 flex items-center justify-between p-2 border rounded border-gray-300 bg-white">
                  <span className="text-gray-900 text-sm">{newDate}</span>
                  <button
                      onClick={() => onOpenDatePicker(newDate, setNewDate)}
                      className="p-1 rounded hover:bg-gray-200 cursor-pointer"
                  >
                    <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                  </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">무게(g)</label>
              <input
                type="text"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                className="mt-1 w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900"
                placeholder="예: 35.4"
              />
            </div>
          </div>
           <button onClick={handleAddEntry} disabled={!newDate || !newWeight} className="w-full flex justify-center items-center space-x-2 px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
            <PlusIcon />
            <span>추가</span>
          </button>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">취소</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90">저장</button>
        </div>
      </div>
    </Modal>
  );
};

export default LarvaHistoryModal;