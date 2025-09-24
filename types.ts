export interface LarvaHistoryEntry {
  id: string;
  date: string;
  weight: string;
}

export interface IndividualBeetle {
  id: string;
  managementNumber: string;
  sex: '♂' | '♀' | '미구분';
  parentInfo: string;
  generation?: string; // 누대
  hatchDate: string; // 우화일
  pupaDate: string; // 용화일
  larvaHatchDate?: string; // 부화일
  feedingStartDate?: string; // 후식 시작일
  larvaHistory: LarvaHistoryEntry[];
  headWidth: string;
  notes: string;
  nextBottleChangeDate?: string;
  imageUrls: string[]; // 개체 사진 (여러 장 지원)
}

export interface Subspecies {
  id: string;
  name: string;
  individuals: IndividualBeetle[];
  bottleChangeInterval?: number; // 병갈이 주기 (개월)
}

export interface Species {
  id: string;
  name: string;
  subspecies: Subspecies[];
}

export interface Genus {
  id: string;
  name: string;
  species: Species[];
}

export type HierarchyItem = 
  | { type: 'genus'; id: string; name: string; }
  | { type: 'species'; id: string; name: string; genusId: string; }
  | { type: 'subspecies'; id: string; name: string; genusId: string; speciesId: string; };

export type ModalMode = 'add' | 'edit' | 'delete' | null;

export type ModalTarget = 
  | { type: 'genus'; data?: Genus }
  | { type: 'species'; parentId: string; data?: Species }
  | { type: 'subspecies'; parentId: string; parentGenusId: string; data?: Subspecies }
  | null;

// New type for lifecycle events
export type LifecycleEvent = 'bottleChange' | 'pupa' | 'hatch' | 'spawn' | 'feed' | 'larvaHatch' | 'createNewLine';


// New types for Auth and Forum
export interface User {
  id: string;
  username: string;
  password: string; // Note: In a real app, never store passwords in plain text.
  isAdmin?: boolean;
}

export type ForumCategory = 'sale' | 'buy' | 'info' | 'log' | 'notice';

export const ForumCategories: Record<ForumCategory, string> = {
    notice: '공지',
    sale: '판매게시판',
    buy: '구매게시판',
    info: '정보게시판',
    log: '사육기게시판'
};

export interface Comment {
  id: string;
  author: string; // username
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  author: string; // username
  title: string;
  content: string;
  createdAt: string;
  comments: Comment[];
  category: ForumCategory;
  imageUrl?: string;
}

// New type for Messaging
export interface Message {
    id: string;
    from: string; // sender's username
    to: string; // receiver's username
    content: string;
    createdAt: string;
    read: boolean;
}