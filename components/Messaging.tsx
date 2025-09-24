import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Message } from '../types';
import { PaperAirplaneIcon } from './icons';

interface MessagingProps {
    currentUser: User;
    users: User[];
    messages: Message[];
    onSendMessage: (to: string, content: string) => void;
    initialTargetUser: string | null;
    onClearInitialTarget: () => void;
}

const Messaging: React.FC<MessagingProps> = ({ currentUser, users, messages, onSendMessage, initialTargetUser, onClearInitialTarget }) => {
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [messageContent, setMessageContent] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    // FIX: Imported useMemo from react to fix compilation error.
    const conversations = useMemo(() => {
        const convos: Record<string, { user: string, lastMessage: Message }> = {};
        messages.forEach(msg => {
            const otherUser = msg.from === currentUser.username ? msg.to : msg.from;
            if (!convos[otherUser] || new Date(msg.createdAt) > new Date(convos[otherUser].lastMessage.createdAt)) {
                convos[otherUser] = { user: otherUser, lastMessage: msg };
            }
        });
        return Object.values(convos).sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
    }, [messages, currentUser.username]);

    // FIX: Imported useMemo from react to fix compilation error.
    const currentChatMessages = useMemo(() => {
        if (!selectedUser) return [];
        return messages.filter(msg =>
            (msg.from === currentUser.username && msg.to === selectedUser) ||
            (msg.from === selectedUser && msg.to === currentUser.username)
        ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [messages, selectedUser, currentUser.username]);

    useEffect(() => {
        if (initialTargetUser) {
            setSelectedUser(initialTargetUser);
            onClearInitialTarget();
        } else if (!selectedUser && conversations.length > 0) {
            setSelectedUser(conversations[0].user);
        }
    }, [initialTargetUser, onClearInitialTarget, conversations, selectedUser]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentChatMessages]);

    const handleSendMessage = () => {
        if (selectedUser && messageContent.trim()) {
            onSendMessage(selectedUser, messageContent);
            setMessageContent('');
        }
    };

    return (
        <div className="flex-1 flex bg-gray-50 h-full overflow-hidden">
            {/* Conversation List */}
            <div className="w-1/3 max-w-xs h-full bg-surface shadow-lg border-r overflow-y-auto p-4 flex flex-col">
                <h2 className="text-2xl font-bold text-text-primary mb-4">대화 목록</h2>
                <div className="flex-grow">
                    {conversations.length > 0 ? conversations.map(convo => (
                        <div key={convo.user}
                             onClick={() => setSelectedUser(convo.user)}
                             className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${selectedUser === convo.user ? 'bg-primary/20' : 'hover:bg-gray-100'}`}>
                            <p className="font-semibold text-text-primary">{convo.user}</p>
                            <p className="text-sm text-gray-500 truncate">{convo.lastMessage.content}</p>
                        </div>
                    )) : <p className="text-center text-gray-500 mt-8">아직 대화가 없습니다.</p>}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
                {selectedUser ? (
                    <>
                        <div className="p-4 border-b bg-white shadow-sm">
                            <h3 className="text-xl font-bold text-text-primary">{selectedUser}</h3>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {currentChatMessages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.from === currentUser.username ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md p-3 rounded-xl ${msg.from === currentUser.username ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}>
                                        <p>{msg.content}</p>
                                        <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 bg-white border-t">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={messageContent}
                                    onChange={e => setMessageContent(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="메시지를 입력하세요..."
                                    className="flex-1 p-3 border rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900"
                                />
                                <button onClick={handleSendMessage} className="p-3 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors shadow">
                                    <PaperAirplaneIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500">대화를 선택해주세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messaging;