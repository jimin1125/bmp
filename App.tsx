import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DataTable from './components/DataTable';
import Modal from './components/Modal';
import LarvaHistoryModal from './components/LarvaHistoryModal';
import Auth from './components/Auth';
import Forum from './components/Forum';
import AdminView from './components/AdminView';
import Messaging from './components/Messaging';
import BatchUpdateModals from './components/BatchUpdateModals';
import ImageManagementModal from './components/ImageManagementModal';
import CustomDatePickerModal from './components/CustomDatePickerModal';
import TaxonomySearchModal from './components/TaxonomySearchModal';
import SpawnModal from './components/SpawnModal'; // New Spawn Modal
import { Genus, Species, Subspecies, IndividualBeetle, ModalMode, ModalTarget, LarvaHistoryEntry, User, Post, Comment, ForumCategory, Message, LifecycleEvent } from './types';
import { BeetleIcon, BellIcon, UsersIcon, LogoutIcon, DatabaseIcon, PaperAirplaneIcon } from './components/icons';
import { fullTaxonomy } from './data/beetleTaxonomy';

const getInitialBeetleData = (): Genus[] => [];

const initialAppData: AppData = {
    beetleData: { 'admin': getInitialBeetleData() },
    posts: [],
    users: [{ id: 'admin', username: 'jimin852', password: 'dynastes852', isAdmin: true }],
    messages: []
};

interface AppData {
    beetleData: Record<string, Genus[]>;
    posts: Post[];
    users: User[];
    messages: Message[];
}

const App: React.FC = () => {
    const [appData, setAppData] = useState<AppData>(() => {
        const savedDataString = localStorage.getItem('beetleManagerData');
        if (!savedDataString) return initialAppData;
        const savedData = JSON.parse(savedDataString);
        if (savedData.beetleData) {
            for (const userId in savedData.beetleData) {
                const userGenera = savedData.beetleData[userId] as Genus[];
                userGenera.forEach(genus => {
                    (genus.species || []).forEach(species => {
                        (species.subspecies || []).forEach(sub => {
                            (sub.individuals || []).forEach(individual => {
                                const ind = individual as any;
                                if (ind.imageUrl && !ind.imageUrls) {
                                    ind.imageUrls = [ind.imageUrl];
                                    delete ind.imageUrl;
                                } else if (!ind.imageUrls) {
                                    ind.imageUrls = [];
                                }
                            });
                        });
                    });
                });
            }
        }
        return { ...initialAppData, ...savedData };
    });

    useEffect(() => {
        localStorage.setItem('beetleManagerData', JSON.stringify(appData));
    }, [appData]);

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedItem, setSelectedItem] = useState<{ type: string; id: string; genusId: string; speciesId: string } | null>(null);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [modalTarget, setModalTarget] = useState<ModalTarget>(null);
    const [itemName, setItemName] = useState('');
    const [bottleInterval, setBottleInterval] = useState('3');
    const [loginError, setLoginError] = useState('');
    const [larvaHistoryModalData, setLarvaHistoryModalData] = useState<{ individual: IndividualBeetle, subspeciesId: string, subspeciesName: string } | null>(null);
    const [imageModalData, setImageModalData] = useState<{ individual: IndividualBeetle, subspeciesId: string } | null>(null);
    const [currentView, setCurrentView] = useState<'manager' | 'forum' | 'admin' | 'messaging'>('manager');
    const [isNotificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
    const [messagingTarget, setMessagingTarget] = useState<string | null>(null);
    const [saleCreationState, setSaleCreationState] = useState<{ active: boolean, selectedIds: Set<string> }>({ active: false, selectedIds: new Set() });
    const [postInitialData, setPostInitialData] = useState<Partial<Post> | null>(null);
    const [lifecycleEventState, setLifecycleEventState] = useState<{ active: boolean, selectedIds: Set<string>, eventType: LifecycleEvent | null, payload?: any }>({ active: false, selectedIds: new Set(), eventType: null });
    const [isBatchUpdateModalOpen, setBatchUpdateModalOpen] = useState(false);
    const [datePickerState, setDatePickerState] = useState<{ isOpen: boolean; initialDate?: string; onSaveCallback?: (date: string) => void; }>({ isOpen: false });
    const [isTaxonomySearchOpen, setTaxonomySearchOpen] = useState(false);
    const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false); // New state for spawn modal

    const handleOpenDatePicker = (initialDate: string, onSaveCallback: (date: string) => void) => setDatePickerState({ isOpen: true, initialDate, onSaveCallback });
    const handleCloseDatePicker = () => setDatePickerState({ isOpen: false });
    const handleSaveDate = (date: string) => {
        datePickerState.onSaveCallback?.(date);
        handleCloseDatePicker();
    };

    const currentUserGenera = currentUser ? appData.beetleData[currentUser.id] || [] : [];
    
    const setCurrentUserGenera = (newGenera: Genus[]) => {
        if (!currentUser) return;
        setAppData(prev => ({ ...prev, beetleData: { ...prev.beetleData, [currentUser.id]: newGenera }}));
    };

    const handleRegister = (username: string, password: string):string => {
        if (appData.users.find(u => u.username === username)) return '이미 사용 중인 아이디입니다.';
        const newUser: User = { id: Date.now().toString(), username, password, isAdmin: false };
        setAppData(prev => ({ ...prev, users: [...prev.users, newUser], beetleData: { ...prev.beetleData, [newUser.id]: getInitialBeetleData() }}));
        return '';
    };

    const handleLogin = (username: string, password: string): boolean => {
        const user = appData.users.find(u => u.username === username && u.password === password);
        if (user) {
            setCurrentUser(user);
            setCurrentView('manager');
            setLoginError('');
            return true;
        }
        setLoginError('아이디 또는 비밀번호가 올바르지 않습니다.');
        return false;
    };

    const handleLogout = () => setCurrentUser(null);
    
    const handleCreatePost = (title: string, content: string, category: ForumCategory, imageUrl?: string) => {
        if (!currentUser) return;
        const newPost: Post = { id: Date.now().toString(), author: currentUser.username, title, content, category, imageUrl, createdAt: new Date().toISOString(), comments: [] };
        setAppData(prev => ({ ...prev, posts: [newPost, ...prev.posts] }));
    };

    const handleEditPost = (postId: string, newTitle: string, newContent: string, newCategory: ForumCategory, newImageUrl?: string) => {
        setAppData(prev => ({ ...prev, posts: prev.posts.map(p => p.id === postId ? { ...p, title: newTitle, content: newContent, category: newCategory, imageUrl: newImageUrl } : p) }));
    };

    const handleAddComment = (postId: string, commentContent: string) => {
        if (!currentUser) return;
        const newComment: Comment = { id: Date.now().toString(), author: currentUser.username, content: commentContent, createdAt: new Date().toISOString() };
        setAppData(prev => ({ ...prev, posts: prev.posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p) }));
    };

    const handleToggleSaleMode = () => setSaleCreationState(prev => ({ active: !prev.active, selectedIds: new Set() }));

    const handleSelectForSale = (individualId: string) => {
        setSaleCreationState(prev => {
            const newSelectedIds = new Set(prev.selectedIds);
            newSelectedIds.has(individualId) ? newSelectedIds.delete(individualId) : newSelectedIds.add(individualId);
            return { ...prev, selectedIds: newSelectedIds };
        });
    };

    const handleFinalizeSalePost = () => {
        if (!activeSubspecies || saleCreationState.selectedIds.size === 0) return;
        const selectedIndividuals = activeSubspecies.individuals.filter(ind => saleCreationState.selectedIds.has(ind.id));
        const title = `[판매] ${activeSubspecies.name} ${selectedIndividuals.length}마리 판매합니다.`;
        const content = selectedIndividuals.map(ind => `------------------------------\n- 관리번호: ${ind.managementNumber}\n- 누대: ${ind.generation || '-'}\n- 성별: ${ind.sex}\n- 부모 정보: ${ind.parentInfo}\n- 우화일: ${ind.hatchDate}\n- 3령 두폭: ${ind.headWidth}mm\n- 비고: ${ind.notes}\n------------------------------`).join('\n');
        const fullContent = `안녕하세요, 아래 개체들을 판매합니다.\n\n${content}\n\n관심 있으신 분은 댓글이나 쪽지 부탁드립니다.`;
        setPostInitialData({ title, content: fullContent, category: 'sale' });
        handleToggleSaleMode();
        setCurrentView('forum');
    };

    const findSubspecies = (subspeciesId: string): {sub: Subspecies, species: Species, genus: Genus} | null => {
        for (const genus of currentUserGenera) { for (const species of genus.species) {
            const found = species.subspecies.find(sub => sub.id === subspeciesId); if (found) return {sub: found, species, genus};
        }}
        return null;
    };
    
    const activeSubspeciesData = useMemo(() => {
        if (selectedItem?.type === 'subspecies') return findSubspecies(selectedItem.id);
        return null;
    }, [selectedItem, currentUserGenera]);

    const activeSubspecies = activeSubspeciesData?.sub || null;

    const handleSelectItem = (type: 'genus' | 'species' | 'subspecies', id: string, parentIds: { genusId?: string, speciesId?: string } = {}) => {
        if (type === 'subspecies') {
            if (!lifecycleEventState.active) {
                setSelectedItem({ type, id, genusId: parentIds.genusId!, speciesId: parentIds.speciesId! });
            } else {
                 setSelectedItem(prev => ({...prev!, type, id, genusId: parentIds.genusId!, speciesId: parentIds.speciesId! }));
            }
        } else { 
            if (!lifecycleEventState.active) {
                setSelectedItem(null); 
            }
        }
    };
    
    const openModal = (mode: ModalMode, target: ModalTarget) => {
        setModalMode(mode); setModalTarget(target);
        if (mode === 'edit' && target && 'data' in target && target.data) {
            setItemName(target.data.name);
            if (target.type === 'subspecies' && target.data.bottleChangeInterval) {
                setBottleInterval(target.data.bottleChangeInterval.toString());
            } else {
                setBottleInterval('3');
            }
        } else { setItemName(''); setBottleInterval('3'); }
    };
    const closeModal = () => { setModalMode(null); setModalTarget(null); setItemName(''); };

    const handleFormSubmit = () => {
        if (!modalTarget || !modalMode || (modalMode !== 'delete' && !itemName.trim())) return;
        let newGenera = JSON.parse(JSON.stringify(currentUserGenera));
        const interval = parseInt(bottleInterval, 10) || 3;

        if (modalMode === 'add') {
            const newItem = { id: Date.now().toString(), name: itemName.trim() };
            if (modalTarget.type === 'genus') { newGenera.push({ ...newItem, species: [] });
            } else if (modalTarget.type === 'species') {
                const genus = newGenera.find((g: Genus) => g.id === modalTarget.parentId); if (genus) genus.species.push({ ...newItem, subspecies: [] });
            } else if (modalTarget.type === 'subspecies') {
                const genus = newGenera.find((g: Genus) => g.id === modalTarget.parentGenusId);
                const species = genus?.species.find((s: Species) => s.id === modalTarget.parentId); if (species) species.subspecies.push({ ...newItem, individuals: [], bottleChangeInterval: interval });
            }
        } else if (modalMode === 'edit' && modalTarget.data) {
            const newName = itemName.trim();
            if (modalTarget.type === 'genus') {
                const genus = newGenera.find((g: Genus) => g.id === modalTarget.data!.id); if (genus) genus.name = newName;
            } else if (modalTarget.type === 'species') {
                for (const g of newGenera) { const species = g.species.find((s: Species) => s.id === modalTarget.data!.id); if (species) { species.name = newName; break; }}
            } else if (modalTarget.type === 'subspecies') {
                 for (const g of newGenera) { for (const s of g.species) { const sub = s.subspecies.find((sub: Subspecies) => sub.id === modalTarget.data!.id); if (sub) { sub.name = newName; sub.bottleChangeInterval = interval; break; }}}
            }
        } else if (modalMode === 'delete' && modalTarget.data) {
             if (modalTarget.type === 'genus') { newGenera = newGenera.filter((g: Genus) => g.id !== modalTarget.data!.id);
            } else if (modalTarget.type === 'species') { newGenera = newGenera.map(g => ({ ...g, species: g.species.filter(s => s.id !== modalTarget.data!.id) }));
            } else if (modalTarget.type === 'subspecies') {
                newGenera = newGenera.map(g => ({ ...g, species: g.species.map(s => ({ ...s, subspecies: s.subspecies.filter(sub => sub.id !== modalTarget.data!.id) })) }));
            }
            if (selectedItem?.id === modalTarget.data.id) setSelectedItem(null);
        }
        setCurrentUserGenera(newGenera); closeModal();
    };

    const handleAdd = (type: 'genus' | 'species' | 'subspecies', parentId?: string, parentGenusId?: string) => {
        if (type === 'genus') openModal('add', { type });
        else if (type === 'species' && parentId) openModal('add', { type, parentId });
        else if (type === 'subspecies' && parentId && parentGenusId) openModal('add', { type, parentId, parentGenusId });
    };
    const handleEdit = (type: 'genus' | 'species' | 'subspecies', item: Genus | Species | Subspecies, parentIds: { genusId?: string, speciesId?: string } = {}) => {
        if (type === 'genus') openModal('edit', { type, data: item as Genus });
        else if (type === 'species' && parentIds.genusId) openModal('edit', { type, parentId: parentIds.genusId, data: item as Species });
        else if (type === 'subspecies' && parentIds.genusId && parentIds.speciesId) openModal('edit', { type, parentId: parentIds.speciesId, parentGenusId: parentIds.genusId, data: item as Subspecies });
    };
    const handleDelete = (type: 'genus' | 'species' | 'subspecies', item: Genus | Species | Subspecies, parentIds: { genusId?: string, speciesId?: string } = {}) => {
        if (type === 'genus') openModal('delete', { type, data: item as Genus });
        else if (type === 'species' && parentIds.genusId) openModal('delete', { type, parentId: parentIds.genusId, data: item as Species });
        else if (type === 'subspecies' && parentIds.genusId && parentIds.speciesId) openModal('delete', { type, parentId: parentIds.speciesId, parentGenusId: parentIds.genusId, data: item as Subspecies });
    };

    const handleUpdateIndividual = (subspeciesId: string, updatedIndividual: IndividualBeetle) => {
        setCurrentUserGenera(currentUserGenera.map(g => ({ ...g, species: g.species.map(s => ({ ...s, subspecies: s.subspecies.map(sub => 
            sub.id === subspeciesId ? { ...sub, individuals: sub.individuals.map(ind => ind.id === updatedIndividual.id ? updatedIndividual : ind) } : sub
        )}))})));
    };

    const handleAddIndividual = (subspeciesId: string) => {
        const newGenera = JSON.parse(JSON.stringify(currentUserGenera));
        let targetSubspecies: Subspecies | undefined;
        for (const g of newGenera) { for (const s of g.species) {
            targetSubspecies = s.subspecies.find(sub => sub.id === subspeciesId); if (targetSubspecies) break;
        } if (targetSubspecies) break; }

        if (targetSubspecies) {
            const existingNumbers = targetSubspecies.individuals.map(ind => parseInt(ind.managementNumber, 10)).filter(num => !isNaN(num));
            const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
            const newIndividual: IndividualBeetle = { id: Date.now().toString(), managementNumber: nextNumber.toString(), sex: '미구분', parentInfo: '', generation: 'CBF1', hatchDate: '', pupaDate: '', larvaHistory: [], headWidth: '', notes: '', imageUrls: [] };
            targetSubspecies.individuals.push(newIndividual);
            setCurrentUserGenera(newGenera);
        }
    };

    const handleDeleteIndividual = (subspeciesId: string, individualId: string) => {
        setCurrentUserGenera(currentUserGenera.map(g => ({ ...g, species: g.species.map(s => ({ ...s, subspecies: s.subspecies.map(sub => 
            sub.id === subspeciesId ? { ...sub, individuals: sub.individuals.filter(ind => ind.id !== individualId) } : sub
        )}))})));
    };
    
    const handleOpenLarvaHistoryModal = (individual: IndividualBeetle, subspeciesId: string, subspeciesName: string) => setLarvaHistoryModalData({ individual: JSON.parse(JSON.stringify(individual)), subspeciesId, subspeciesName });
    const handleCloseLarvaHistoryModal = () => setLarvaHistoryModalData(null);
    
    const handleSaveLarvaHistory = (subspeciesId: string, individualId: string, newHistory: LarvaHistoryEntry[]) => {
        const newGenera = JSON.parse(JSON.stringify(currentUserGenera));
        let individualToUpdate: IndividualBeetle | undefined;
        let subspeciesData = findSubspecies(subspeciesId);

        if (subspeciesData) {
            const { sub } = subspeciesData;
            const genus = newGenera.find((g: Genus) => g.id === subspeciesData.genus.id);
            const species = genus?.species.find((s: Species) => s.id === subspeciesData.species.id);
            const targetSub = species?.subspecies.find((ss: Subspecies) => ss.id === subspeciesId);
            if(targetSub) {
                individualToUpdate = targetSub.individuals.find(i => i.id === individualId);
            }
        }

        if (individualToUpdate && subspeciesData) {
            individualToUpdate.larvaHistory = newHistory;
            if (newHistory.length > 0) {
                const lastEntry = [...newHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                const lastDate = new Date(lastEntry.date);
                const interval = subspeciesData.sub.bottleChangeInterval || 3;
                lastDate.setMonth(lastDate.getMonth() + interval);
                individualToUpdate.nextBottleChangeDate = lastDate.toISOString().split('T')[0];
            } else { delete individualToUpdate.nextBottleChangeDate; }
        }
        setCurrentUserGenera(newGenera); handleCloseLarvaHistoryModal();
    };

    const handleOpenImageModal = (individual: IndividualBeetle, subspeciesId: string) => setImageModalData({ individual, subspeciesId });
    const handleCloseImageModal = () => setImageModalData(null);
    const handleSaveImages = (subspeciesId: string, individualId: string, newImageUrls: string[]) => {
        const individual = findSubspecies(subspeciesId)?.sub.individuals.find(i => i.id === individualId);
        if (individual) {
            handleUpdateIndividual(subspeciesId, { ...individual, imageUrls: newImageUrls });
        }
        handleCloseImageModal();
    };

    const handleSendMessage = (to: string, content: string) => {
        if (!currentUser || !to || !content.trim()) return;
        const newMessage: Message = { id: Date.now().toString(), from: currentUser.username, to, content, createdAt: new Date().toISOString(), read: false };
        setAppData(prev => ({ ...prev, messages: [...prev.messages, newMessage] }));
    };

    const handleStartConversation = (username: string) => {
        if (currentUser?.username === username) return;
        setMessagingTarget(username);
        setCurrentView('messaging');
    };

    const handleStartLifecycleEvent = (eventType: LifecycleEvent) => {
        if (eventType === 'spawn') {
            setIsSpawnModalOpen(true);
        } else {
            setLifecycleEventState({ active: true, selectedIds: new Set(), eventType });
        }
    };
    
    const handleCancelLifecycleEvent = () => {
         setLifecycleEventState({ active: false, selectedIds: new Set(), eventType: null });
    }

    const handleSelectForLifecycleEvent = (individualId: string) => {
        setLifecycleEventState(prev => {
            const newSelectedIds = new Set(prev.selectedIds);
            newSelectedIds.has(individualId) ? newSelectedIds.delete(individualId) : newSelectedIds.add(individualId);
            return { ...prev, selectedIds: newSelectedIds };
        });
    };
    
    const findIndividualAndHierarchy = (genera: Genus[], individualId: string): { ind: IndividualBeetle, sub: Subspecies, species: Species, genus: Genus } | null => {
        for (const g of genera) { for (const s of g.species) { for (const sub of s.subspecies) {
            const ind = sub.individuals.find(i => i.id === individualId);
            if (ind) return { ind, sub, species: s, genus: g };
        }}}
        return null;
    }
    
    const handleFinalizeLifecycleSelection = () => {
        const { eventType, selectedIds } = lifecycleEventState;
        if (selectedIds.size === 0) {
            handleCancelLifecycleEvent();
            return;
        }

        const allSelected = Array.from(selectedIds).map(id => findIndividualAndHierarchy(currentUserGenera, id)).filter(Boolean) as NonNullable<ReturnType<typeof findIndividualAndHierarchy>>[];
        
        if (eventType === 'createNewLine') {
            const lineName = prompt('새로운 라인의 이름을 입력하세요:');
            if (!lineName || lineName.trim() === '') {
                handleCancelLifecycleEvent();
                return;
            }

            if (allSelected.length > 0) {
                const parentSpeciesData = allSelected[0].species;
                if (allSelected.some(item => item.species.id !== parentSpeciesData.id)) {
                    alert('다른 종(species)에 속한 개체들은 하나의 라인으로 합칠 수 없습니다.');
                    handleCancelLifecycleEvent();
                    return;
                }
                
                setAppData(prev => {
                    const newAppData = JSON.parse(JSON.stringify(prev));
                    if (!currentUser) return prev;
                    const currentUserGenera = newAppData.beetleData[currentUser.id];
                    const parentSpecies = currentUserGenera.flatMap((g: Genus) => g.species).find((s: Species) => s.id === parentSpeciesData.id);
                    if (!parentSpecies) return prev;

                    const newSubspecies: Subspecies = { id: Date.now().toString(), name: lineName.trim(), individuals: [], bottleChangeInterval: 3 };
                    
                    allSelected.forEach(item => {
                       const originalHierarchy = findIndividualAndHierarchy(currentUserGenera, item.ind.id);
                       if (originalHierarchy) {
                           const { ind, sub: originalSub } = originalHierarchy;
                           ind.notes = `${ind.notes || ''} [${new Date().toISOString().split('T')[0]}: ${originalSub.name}에서 ${lineName}으로 이동]`.trim();
                           newSubspecies.individuals.push(ind);
                           originalSub.individuals = originalSub.individuals.filter(i => i.id !== ind.id);
                       }
                    });
                    parentSpecies.subspecies.push(newSubspecies);
                    return newAppData;
                });
            }
            handleCancelLifecycleEvent();
        } else {
            setBatchUpdateModalOpen(true);
        }
    };

    const handleSpawnSave = (payload: {
        males: { ind: IndividualBeetle, sub: Subspecies, species: Species, genus: Genus }[];
        females: { ind: IndividualBeetle, sub: Subspecies, species: Species, genus: Genus }[];
        spawnData: Record<string, { date: string; count: string }>;
        decision: {
            scenario: 'INTER_SPECIES' | 'INTER_LINE' | 'NORMAL';
            createNew?: boolean;
            newSpeciesName?: string;
            newLineName?: string;
        };
    }) => {
        const { males, females, spawnData, decision } = payload;
        
        setAppData(prev => {
            const newAppData = JSON.parse(JSON.stringify(prev));
            if (!currentUser) return prev;
            const currentUserGenera = newAppData.beetleData[currentUser.id] as Genus[];

            const parseGen = (genString?: string): { prefix: 'WF' | 'CBF', fNum: number } => {
                const s = genString || 'CBF0';
                const prefixMatch = s.match(/^[A-Z]+/i);
                const numberMatch = s.match(/\d+$/);
                const prefix = (prefixMatch ? prefixMatch[0].toUpperCase() : 'CBF') as 'WF' | 'CBF';
                const fNum = numberMatch ? parseInt(numberMatch[0], 10) : 0;
                return { prefix, fNum };
            };
            const getParentDetailString = (parent: { ind: IndividualBeetle, sub: Subspecies, species: Species }) => {
                return `${parent.species.name} ${parent.sub.name} ${parent.ind.managementNumber}`;
            };
            const allNumbers = newAppData.beetleData[currentUser.id].flatMap((g: Genus) => g.species.flatMap((s: Species) => s.subspecies.flatMap((sub: Subspecies) => sub.individuals.map((i: IndividualBeetle) => parseInt(i.managementNumber, 10))))).filter((num: number) => !isNaN(num));
            let nextNumber = allNumbers.length > 0 ? Math.max(...allNumbers) + 1 : 1;

            const father = males.length > 0 ? males[0] : null;

            females.forEach(mother => {
                const femaleSpawnData = spawnData[mother.ind.id];
                if (!femaleSpawnData || !femaleSpawnData.count || parseInt(femaleSpawnData.count) <= 0) return;

                let targetSubspecies: Subspecies | undefined;
                
                if (decision.scenario === 'INTER_SPECIES' && decision.newSpeciesName && decision.newLineName) {
                    const parentGenus = currentUserGenera.find(g => g.id === mother.genus.id);
                    if (parentGenus) {
                        const newSpecies: Species = { id: `${Date.now()}-s-${Math.random()}`, name: decision.newSpeciesName, subspecies: [] };
                        const newSub: Subspecies = { id: `${Date.now()}-sub-${Math.random()}`, name: decision.newLineName, individuals: [], bottleChangeInterval: 3 };
                        newSpecies.subspecies.push(newSub);
                        parentGenus.species.push(newSpecies);
                        targetSubspecies = newSub;
                    }
                } else if (decision.scenario === 'INTER_LINE' && decision.createNew && decision.newLineName) {
                     const parentSpecies = currentUserGenera.flatMap(g => g.species).find(s => s.id === mother.species.id);
                     if (parentSpecies) {
                        const newSub: Subspecies = { id: `${Date.now()}-sub-${Math.random()}`, name: decision.newLineName, individuals: [], bottleChangeInterval: 3 };
                        parentSpecies.subspecies.push(newSub);
                        targetSubspecies = newSub;
                     }
                } else {
                    const motherHierarchy = findIndividualAndHierarchy(currentUserGenera, mother.ind.id);
                    targetSubspecies = motherHierarchy?.sub;
                }

                if (!targetSubspecies) return;

                const motherGen = parseGen(mother.ind.generation);
                let newPrefix: 'WF' | 'CBF';
                let newFNum: number;

                if (father) {
                    const fatherGen = parseGen(father.ind.generation);
                    newPrefix = (fatherGen.prefix === 'WF' && motherGen.prefix === 'WF') ? 'WF' : 'CBF';
                    newFNum = (decision.scenario === 'INTER_SPECIES' || (decision.scenario === 'INTER_LINE' && decision.createNew)) ? 1 : Math.max(fatherGen.fNum, motherGen.fNum) + 1;
                } else {
                    newPrefix = 'CBF';
                    newFNum = (decision.scenario === 'INTER_SPECIES' || (decision.scenario === 'INTER_LINE' && decision.createNew)) ? 1 : motherGen.fNum + 1;
                }
                const nextGenerationStr = `${newPrefix}${newFNum}`;

                let parentInfoParts = [];
                if (father) parentInfoParts.push(`부: ${getParentDetailString(father)}`);
                parentInfoParts.push(`모: ${getParentDetailString(mother)}`);
                const parentInfo = parentInfoParts.join(', ');

                for (let i = 0; i < parseInt(femaleSpawnData.count, 10); i++) {
                    const newIndividual: IndividualBeetle = {
                        id: `${Date.now()}-${i}-${mother.ind.id}`,
                        managementNumber: (nextNumber++).toString(),
                        sex: '미구분', parentInfo, generation: nextGenerationStr, larvaHatchDate: femaleSpawnData.date,
                        hatchDate: '', pupaDate: '', larvaHistory: [], headWidth: '', notes: '', imageUrls: []
                    };
                    targetSubspecies.individuals.push(newIndividual);
                }
            });
            return newAppData;
        });
        setIsSpawnModalOpen(false);
    };

    const handleBatchUpdate = (updates: any[]) => {
        const { eventType } = lifecycleEventState;
        const newGenera = JSON.parse(JSON.stringify(currentUserGenera));
        let wasUpdated = false;
        
        if (eventType === 'bottleChange') {
            updates.forEach(update => {
                const found = findIndividualAndHierarchy(newGenera, update.id);
                if (found) {
                    found.ind.headWidth = update.headWidth;
                    if (update.weight.trim() !== '') {
                        const newHistoryEntry = { id: `${Date.now()}-${update.id}`, date: update.date, weight: update.weight };
                        found.ind.larvaHistory.push(newHistoryEntry);
                        const lastDate = new Date(update.date);
                        const interval = found.sub.bottleChangeInterval || 3;
                        lastDate.setMonth(lastDate.getMonth() + interval);
                        found.ind.nextBottleChangeDate = lastDate.toISOString().split('T')[0];
                    }
                    wasUpdated = true;
                }
            });
        } else if (eventType === 'createNewLine') {
            // This is handled by handleFinalizeLifecycleSelection now
        } else {
            const dateFieldMap = { pupa: 'pupaDate', hatch: 'hatchDate', feed: 'feedingStartDate', larvaHatch: 'larvaHatchDate' } as const;
            type DateEvent = keyof typeof dateFieldMap;
            const isDateEvent = (event: string): event is DateEvent => event in dateFieldMap;

            if (eventType && isDateEvent(eventType)) {
                const field = dateFieldMap[eventType];
                updates.forEach(update => {
                    const found = findIndividualAndHierarchy(newGenera, update.id);
                    if (found) {
                        found.ind[field] = update.date;
                        wasUpdated = true;
                    }
                });
            }
        }
        
        if(wasUpdated) setCurrentUserGenera(newGenera);
        setBatchUpdateModalOpen(false);
        handleCancelLifecycleEvent();
    };

    const notifications = useMemo(() => {
        if (!currentUser) return [];
        const today = new Date(); today.setHours(0,0,0,0);
        return currentUserGenera.flatMap(g => g.species.flatMap(s => s.subspecies.flatMap(sub => sub.individuals.filter(ind => ind.nextBottleChangeDate && new Date(ind.nextBottleChangeDate) < today)
            .map(ind => ({ text: `${sub.name} - ${ind.managementNumber} 병 교체일이 지났습니다.`, date: ind.nextBottleChangeDate }))
        )));
    }, [currentUserGenera, currentUser]);
    
    const getModalTitle = () => {
        if (!modalMode || !modalTarget) return '';
        const typeKor = { genus: '속', species: '종', subspecies: '아종/라인' };
        const actionKor = { add: '추가', edit: '수정', delete: '삭제' };
        const targetName = modalTarget.data ? `"${modalTarget.data.name}"` : '';
        if (modalTarget.type === null) return '';
        return `${typeKor[modalTarget.type]} ${targetName} ${actionKor[modalMode!]}`.trim();
    };

    const handleSelectTaxonomy = (selection: { genus: string; species: string; subspecies: string }) => {
        let newGenera = JSON.parse(JSON.stringify(currentUserGenera));
        let genus = newGenera.find((g: Genus) => g.name.toLowerCase() === selection.genus.toLowerCase());
        if (!genus) {
            genus = { id: Date.now().toString(), name: selection.genus, species: [] };
            newGenera.push(genus);
        }
        let species = genus.species.find((s: Species) => s.name.toLowerCase() === selection.species.toLowerCase());
        if (!species) {
            species = { id: `${Date.now()}-s`, name: selection.species, subspecies: [] };
            genus.species.push(species);
        }
        let subspecies = species.subspecies.find((sub: Subspecies) => sub.name.toLowerCase() === selection.subspecies.toLowerCase());
        if (!subspecies) {
            species.subspecies.push({ id: `${Date.now()}-sub`, name: selection.subspecies, individuals: [], bottleChangeInterval: 3 });
        }
        setCurrentUserGenera(newGenera);
        setTaxonomySearchOpen(false);
    };

    if (!currentUser) return <Auth onLogin={handleLogin} onRegister={handleRegister} loginError={loginError} />;

    return (
        <div className="h-screen w-screen bg-background flex flex-col font-sans">
            <header className="w-full bg-primary text-white p-4 shadow-md flex justify-between items-center z-10 shrink-0">
                <div className="flex items-center space-x-3"><BeetleIcon className="w-8 h-8"/><h1 className="text-2xl font-bold">Beetle Manager Pro</h1></div>
                <div className="flex items-center space-x-2">
                     <button onClick={() => setCurrentView('manager')} className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'manager' ? 'bg-accent/80' : 'hover:bg-accent/50'}`}>사육 관리</button>
                     <button onClick={() => setCurrentView('forum')} className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'forum' ? 'bg-accent/80' : 'hover:bg-accent/50'}`}>커뮤니티</button>
                     <button onClick={() => setCurrentView('messaging')} className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'messaging' ? 'bg-accent/80' : 'hover:bg-accent/50'}`}>쪽지</button>
                     {currentUser.isAdmin && <button onClick={() => setCurrentView('admin')} className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'admin' ? 'bg-accent/80' : 'hover:bg-accent/50'}`}>데이터 관리</button>}
                </div>
                <div className="flex items-center space-x-4">
                    <span className="font-semibold">환영합니다, {currentUser.username}님!</span>
                    <div className="relative">
                        <button onClick={() => setNotificationPopoverOpen(p => !p)} className="relative text-white hover:text-gray-200">
                            <BellIcon className="w-7 h-7"/>
                            {notifications.length > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">{notifications.length}</span>}
                        </button>
                        {isNotificationPopoverOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-20 text-gray-800">
                                <div className="p-2 font-bold border-b">알림</div>
                                <ul className="p-2 max-h-64 overflow-y-auto">
                                    {notifications.length > 0 ? notifications.map((n, i) => (
                                        <li key={i} className="text-sm p-2 hover:bg-gray-100 rounded">
                                            <p className="font-semibold">{n.text}</p><p className="text-xs text-red-500">예정일: {n.date}</p>
                                        </li>
                                    )) : <li className="text-sm p-2 text-center text-gray-500">새로운 알림이 없습니다.</li>}
                                </ul>
                            </div>
                        )}
                    </div>
                     <button onClick={handleLogout} className="text-white hover:text-gray-200" title="로그아웃"><LogoutIcon className="w-7 h-7"/></button>
                </div>
            </header>
            <main className="flex flex-1 overflow-hidden">
                 {currentView === 'manager' && <>
                    <Sidebar data={currentUserGenera} selectedItem={selectedItem} onSelectItem={handleSelectItem} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} onOpenTaxonomySearch={() => setTaxonomySearchOpen(true)} />
                    <DataTable 
                        subspecies={activeSubspecies} 
                        onUpdateIndividual={handleUpdateIndividual} 
                        onAddIndividual={handleAddIndividual} 
                        onDeleteIndividual={handleDeleteIndividual} 
                        onOpenLarvaHistoryModal={handleOpenLarvaHistoryModal} 
                        onOpenImageModal={handleOpenImageModal}
                        onOpenDatePicker={handleOpenDatePicker}
                        saleCreationState={saleCreationState} 
                        onToggleSaleMode={handleToggleSaleMode}
                        onSelectForSale={handleSelectForSale} 
                        onFinalizeSalePost={handleFinalizeSalePost}
                        lifecycleEventState={lifecycleEventState}
                        onStartLifecycleEvent={handleStartLifecycleEvent}
                        onSelectForLifecycleEvent={handleSelectForLifecycleEvent}
                        onFinalizeLifecycleSelection={handleFinalizeLifecycleSelection}
                        onCancelLifecycleEvent={handleCancelLifecycleEvent}
                    />
                </>}
                {currentView === 'forum' && <Forum currentUser={currentUser} posts={appData.posts} onCreatePost={handleCreatePost} onEditPost={handleEditPost} onAddComment={handleAddComment} initialData={postInitialData} onInitialDataConsumed={() => setPostInitialData(null)} onStartConversation={handleStartConversation} />}
                {currentView === 'admin' && currentUser.isAdmin && <AdminView allBeetleData={appData.beetleData} users={appData.users} />}
                {currentView === 'messaging' && <Messaging currentUser={currentUser} users={appData.users} messages={appData.messages} onSendMessage={handleSendMessage} initialTargetUser={messagingTarget} onClearInitialTarget={() => setMessagingTarget(null)} />}
            </main>
            <Modal isOpen={!!modalMode} onClose={closeModal} title={getModalTitle()}>
                {modalMode === 'delete' ? (
                    <div>
                        <p>정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
                        <div className="flex justify-end space-x-2 mt-4">
                            <button type="button" onClick={closeModal} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">취소</button>
                            <button type="button" onClick={handleFormSubmit} className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600">삭제</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">이름</label>
                            <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="mt-1 w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900" autoFocus required />
                        </div>
                        {modalTarget?.type === 'subspecies' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">병갈이 주기 (개월)</label>
                            <input type="number" value={bottleInterval} onChange={(e) => setBottleInterval(e.target.value)} className="mt-1 w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900" min="1" placeholder="기본값: 3" />
                          </div>
                        )}
                        <div className="flex justify-end space-x-2 mt-4">
                            <button type="button" onClick={closeModal} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">취소</button>
                            <button type="submit" className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90">{modalMode === 'add' ? '추가' : '수정'}</button>
                        </div>
                    </form>
                )}
            </Modal>
            <LarvaHistoryModal isOpen={!!larvaHistoryModalData} onClose={handleCloseLarvaHistoryModal} modalData={larvaHistoryModalData} onSave={handleSaveLarvaHistory} onOpenDatePicker={handleOpenDatePicker} />
            <ImageManagementModal isOpen={!!imageModalData} onClose={handleCloseImageModal} modalData={imageModalData} onSave={handleSaveImages} />
            <BatchUpdateModals 
                isOpen={isBatchUpdateModalOpen}
                eventType={lifecycleEventState.eventType}
                selectedIndividuals={
                    Array.from(lifecycleEventState.selectedIds)
                         .map(id => findIndividualAndHierarchy(currentUserGenera, id)?.ind)
                         .filter(Boolean) as IndividualBeetle[]
                }
                onClose={() => { setBatchUpdateModalOpen(false); handleCancelLifecycleEvent(); }}
                onSave={(updates) => handleBatchUpdate(updates)}
                onOpenDatePicker={handleOpenDatePicker}
            />
             {isSpawnModalOpen && (
                <SpawnModal
                    isOpen={isSpawnModalOpen}
                    onClose={() => setIsSpawnModalOpen(false)}
                    allGenera={currentUserGenera}
                    onSave={handleSpawnSave}
                    onOpenDatePicker={handleOpenDatePicker}
                />
            )}
            <CustomDatePickerModal isOpen={datePickerState.isOpen} onClose={handleCloseDatePicker} initialDate={datePickerState.initialDate} onSave={handleSaveDate} />
            <TaxonomySearchModal isOpen={isTaxonomySearchOpen} onClose={() => setTaxonomySearchOpen(false)} onSelect={handleSelectTaxonomy} />
        </div>
    );
};

export default App;