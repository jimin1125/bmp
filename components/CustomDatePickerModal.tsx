import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface CustomDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string) => void;
  initialDate?: string; // YYYY-MM-DD
}

const CustomDatePickerModal: React.FC<CustomDatePickerModalProps> = ({ isOpen, onClose, onSave, initialDate }) => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [day, setDay] = useState<number>(new Date().getDate());

  useEffect(() => {
    const initial = initialDate ? new Date(initialDate + 'T00:00:00') : new Date();
    if (initialDate && !isNaN(initial.getTime())) {
        setYear(initial.getFullYear());
        setMonth(initial.getMonth() + 1);
        setDay(initial.getDate());
    } else {
        const today = new Date();
        setYear(today.getFullYear());
        setMonth(today.getMonth() + 1);
        setDay(today.getDate());
    }
  }, [initialDate, isOpen]);
  
  const handleSave = () => {
    const daysInSelectedMonth = new Date(year, month, 0).getDate();
    const correctedDay = Math.min(day, daysInSelectedMonth);
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = correctedDay.toString().padStart(2, '0');
    onSave(`${year}-${formattedMonth}-${formattedDay}`);
  };

  const years = Array.from({ length: 41 }, (_, i) => new Date().getFullYear() - 20 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="날짜 선택">
      <div className="space-y-4">
        <div className="flex justify-center space-x-4">
          <div>
            <label htmlFor="year-select" className="block text-sm font-medium text-gray-700">년</label>
            <select id="year-select" value={year} onChange={e => setYear(Number(e.target.value))} className="mt-1 w-full p-2 border rounded border-gray-300 bg-white text-gray-900">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="month-select" className="block text-sm font-medium text-gray-700">월</label>
            <select id="month-select" value={month} onChange={e => setMonth(Number(e.target.value))} className="mt-1 w-full p-2 border rounded border-gray-300 bg-white text-gray-900">
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="day-select" className="block text-sm font-medium text-gray-700">일</label>
            <select id="day-select" value={day} onChange={e => setDay(Number(e.target.value))} className="mt-1 w-full p-2 border rounded border-gray-300 bg-white text-gray-900">
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">취소</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90">선택 완료</button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomDatePickerModal;