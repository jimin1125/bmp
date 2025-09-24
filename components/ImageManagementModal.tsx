import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { IndividualBeetle } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface ImageManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalData: {
    individual: IndividualBeetle;
    subspeciesId: string;
  } | null;
  onSave: (subspeciesId: string, individualId: string, newImageUrls: string[]) => void;
}

const ImageManagementModal: React.FC<ImageManagementModalProps> = ({ isOpen, onClose, modalData, onSave }) => {
  const [images, setImages] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modalData) {
      setImages(modalData.individual.imageUrls);
    } else {
      setImages([]);
    }
    setLightboxImage(null); // Close lightbox when modal data changes
  }, [modalData]);

  if (!isOpen || !modalData) return null;

  const { individual, subspeciesId } = modalData;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow uploading the same file again
    if(e.target) e.target.value = '';
  };

  const handleDeleteImage = (indexToDelete: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToDelete));
  };

  const handleSave = () => {
    onSave(subspeciesId, individual.id, images);
  };

  const title = `${individual.managementNumber || '개체'} 이미지 관리`;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 max-h-80 overflow-y-auto p-2 border rounded-lg bg-gray-50">
            {images.map((img, index) => (
              <div key={index} className="relative group cursor-pointer" onClick={() => setLightboxImage(img)}>
                <img src={img} alt={`image-${index}`} className="w-full h-32 object-cover rounded-md shadow-sm" />
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening lightbox when deleting
                    handleDeleteImage(index);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="이미지 삭제"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <PlusIcon className="w-8 h-8" />
              <span className="text-sm mt-1">이미지 추가</span>
            </button>
          </div>
          {images.length === 0 && (
            <p className="text-center text-gray-500">업로드된 이미지가 없습니다.</p>
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">닫기</button>
            <button type="button" onClick={handleSave} className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90">저장</button>
          </div>
        </div>
      </Modal>
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Enlarged view"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
          />
           <button 
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
            >
                &times;
            </button>
        </div>
      )}
    </>
  );
};

export default ImageManagementModal;
