import React, { useState, useMemo } from 'react';
import { Genus, IndividualBeetle, User, LarvaHistoryEntry } from '../types';
import { ChevronRightIcon } from './icons';

interface AdminViewProps {
  allBeetleData: Record<string, Genus[]>;
  users: User[];
}

const DetailedIndividualInfo: React.FC<{ individual: IndividualBeetle }> = ({ individual }) => (
    <div className="bg-gray-100 p-3 mt-2 rounded-md text-xs space-y-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <p><strong className="font-semibold text-gray-600">용화일:</strong> {individual.pupaDate || '-'}</p>
            <p><strong className="font-semibold text-gray-600">3령 두폭:</strong> {individual.headWidth ? `${individual.headWidth} mm` : '-'}</p>
            <p><strong className="font-semibold text-gray-600">다음 병갈이:</strong> {individual.nextBottleChangeDate || '-'}</p>
        </div>
        {individual.larvaHistory.length > 0 && (
            <div>
                <strong className="font-semibold text-gray-600">유충 기록:</strong>
                <div className="mt-1 max-h-28 overflow-y-auto border rounded bg-white">
                    <table className="w-full">
                        <thead className="bg-gray-200"><tr><th className="px-2 py-1 text-left">날짜</th><th className="px-2 py-1 text-left">무게(g)</th></tr></thead>
                        <tbody>
                            {individual.larvaHistory.map(entry => (<tr key={entry.id} className="border-b"><td className="px-2 py-1">{entry.date}</td><td className="px-2 py-1">{entry.weight}</td></tr>))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
);

const UserViewIndividualRow: React.FC<{ individual: IndividualBeetle }> = ({ individual }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="text-xs border-b">
            <div className="grid grid-cols-6 gap-2 p-2 hover:bg-gray-50 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <span className="flex items-center"><ChevronRightIcon className={`w-3 h-3 mr-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />{individual.managementNumber}</span>
                <span>{individual.sex}</span><span className="truncate">{individual.parentInfo || '-'}</span><span>{individual.hatchDate || '-'}</span><span className="truncate col-span-2">{individual.notes || '-'}</span>
            </div>
            {isExpanded && <DetailedIndividualInfo individual={individual} />}
        </div>
    );
};

const UserView = ({ allBeetleData, users }: AdminViewProps) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    const regularUsers = users.filter(u => !u.isAdmin);

    return (
        <div className="space-y-6">
            {regularUsers.map(user => (
              <div key={user.id} className="bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-text-primary p-4 border-b cursor-pointer flex items-center" onClick={() => toggleExpand(`user-${user.id}`)}>
                    <ChevronRightIcon className={`w-5 h-5 mr-2 transition-transform ${expanded[`user-${user.id}`] ? 'rotate-90' : ''}`} /> 사용자: {user.username}
                </h3>
                {expanded[`user-${user.id}`] && (
                    <div className="p-4 space-y-2">
                        {(allBeetleData[user.id] || []).map(genus => (
                            <div key={genus.id} className="pl-2 border-l-2">
                                <h4 className="font-bold cursor-pointer flex items-center" onClick={() => toggleExpand(`genus-${genus.id}-${user.id}`)}>
                                    <ChevronRightIcon className={`w-4 h-4 mr-1 transition-transform ${expanded[`genus-${genus.id}-${user.id}`] ? 'rotate-90' : ''}`} /> 속: {genus.name}
                                </h4>
                                {expanded[`genus-${genus.id}-${user.id}`] && genus.species.map(species => (
                                    <div key={species.id} className="pl-4 mt-1 border-l-2">
                                        <h5 className="font-semibold text-gray-700 cursor-pointer flex items-center" onClick={() => toggleExpand(`species-${species.id}-${user.id}`)}>
                                            <ChevronRightIcon className={`w-4 h-4 mr-1 transition-transform ${expanded[`species-${species.id}-${user.id}`] ? 'rotate-90' : ''}`} /> 종: {species.name}
                                        </h5>
                                        {expanded[`species-${species.id}-${user.id}`] && species.subspecies.map(sub => (
                                            <div key={sub.id} className="pl-4 mt-1">
                                                <p className="text-sm text-gray-600">아종/라인: {sub.name} ({sub.individuals.length} 개체)</p>
                                                {sub.individuals.length > 0 && (<div className="text-xs bg-gray-50 rounded mt-1 p-2">
                                                    <div className="grid grid-cols-6 gap-2 font-bold text-gray-500 p-2 border-b">
                                                        <span>관리번호</span><span>성별</span><span>부모정보</span><span>우화일</span><span className="col-span-2">비고</span>
                                                    </div>
                                                    {sub.individuals.map(ind => <UserViewIndividualRow key={ind.id} individual={ind} />)}
                                                </div>)}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ))}
                        {(allBeetleData[user.id] || []).length === 0 && <p className="text-sm text-gray-400 pl-4">이 사용자의 데이터가 없습니다.</p>}
                    </div>
                )}
              </div>
            ))}
        </div>
    );
};

const TaxonomyView = ({ allBeetleData, users }: AdminViewProps) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const taxonomyData = useMemo(() => {
        const data: Record<string, any> = {};
        const userMap = new Map(users.map(u => [u.id, u.username]));

        for (const userId in allBeetleData) {
            const username = userMap.get(userId) || userId;
            for (const genus of allBeetleData[userId]) {
                const genusKey = `${genus.name}`;
                if (!data[genusKey]) data[genusKey] = {};
                for (const species of genus.species) {
                    const speciesKey = `${species.name}`;
                    if (!data[genusKey][speciesKey]) data[genusKey][speciesKey] = {};
                    for (const sub of species.subspecies) {
                        const subKey = `${sub.name}`;
                        if (!data[genusKey][speciesKey][subKey]) data[genusKey][speciesKey][subKey] = [];
                        sub.individuals.forEach(ind => data[genusKey][speciesKey][subKey].push({ ...ind, owner: username }));
                    }
                }
            }
        }
        return data;
    }, [allBeetleData, users]);

    return (
         <div className="space-y-4">
            {Object.entries(taxonomyData).map(([genusName, speciesData]) => (
                <div key={genusName} className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-xl font-bold flex items-center cursor-pointer" onClick={() => toggleExpand(genusName)}>
                        <ChevronRightIcon className={`w-5 h-5 mr-2 transition-transform ${expanded[genusName] ? 'rotate-90' : ''}`} /> {genusName}
                    </h3>
                    {expanded[genusName] && Object.entries(speciesData as any).map(([speciesName, subData]) => (
                        <div key={speciesName} className="pl-4 mt-2 border-l-2">
                             <h4 className="text-lg font-semibold text-gray-700 flex items-center cursor-pointer" onClick={() => toggleExpand(`${genusName}-${speciesName}`)}>
                                <ChevronRightIcon className={`w-4 h-4 mr-1 transition-transform ${expanded[`${genusName}-${speciesName}`] ? 'rotate-90' : ''}`} /> {speciesName}
                            </h4>
                            {expanded[`${genusName}-${speciesName}`] && Object.entries(subData as any).map(([subName, individuals]) => (
                                <div key={subName} className="pl-4 mt-2">
                                    <p className="font-medium">{subName}</p>
                                    <div className="overflow-x-auto mt-1 rounded-lg border">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    {['사육자', '관리번호', '성별', '부모정보', '우화일', '3령두폭', '비고'].map(h => <th key={h} className="px-2 py-2 text-left font-semibold text-gray-600">{h}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {(individuals as any[]).map(ind => (
                                                    <tr key={ind.id} className="hover:bg-gray-50">
                                                        <td className="px-2 py-1.5">{ind.owner}</td>
                                                        <td className="px-2 py-1.5">{ind.managementNumber}</td>
                                                        <td className="px-2 py-1.5">{ind.sex}</td>
                                                        <td className="px-2 py-1.5 truncate max-w-xs">{ind.parentInfo}</td>
                                                        <td className="px-2 py-1.5">{ind.hatchDate}</td>
                                                        <td className="px-2 py-1.5">{ind.headWidth}</td>
                                                        <td className="px-2 py-1.5 truncate max-w-xs">{ind.notes}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

const AdminView: React.FC<AdminViewProps> = ({ allBeetleData, users }) => {
    const [viewMode, setViewMode] = useState<'user' | 'taxonomy'>('user');

    return (
        <div className="flex-1 p-6 lg:p-8 bg-gray-50 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-text-primary">전체 사용자 데이터</h2>
                <div className="flex items-center space-x-2 bg-gray-200 p-1 rounded-lg">
                    <button onClick={() => setViewMode('user')} className={`px-4 py-1.5 rounded-md text-sm font-semibold ${viewMode === 'user' ? 'bg-white shadow' : 'text-gray-600'}`}>사용자별 보기</button>
                    <button onClick={() => setViewMode('taxonomy')} className={`px-4 py-1.5 rounded-md text-sm font-semibold ${viewMode === 'taxonomy' ? 'bg-white shadow' : 'text-gray-600'}`}>분류군별 보기</button>
                </div>
            </div>
            {viewMode === 'user' ? (
                <UserView allBeetleData={allBeetleData} users={users} />
            ) : (
                <TaxonomyView allBeetleData={allBeetleData} users={users} />
            )}
        </div>
    );
};

export default AdminView;
