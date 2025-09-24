import React, { useState, useEffect } from 'react';
import { Post, User, Comment, ForumCategory, ForumCategories } from '../types';
import { PlusIcon, PencilIcon, MegaphoneIcon } from './icons';
import Modal from './Modal';

interface ForumProps {
  currentUser: User;
  posts: Post[];
  onCreatePost: (title: string, content: string, category: ForumCategory, imageUrl?: string) => void;
  onEditPost: (postId: string, title: string, content: string, category: ForumCategory, imageUrl?: string) => void;
  onAddComment: (postId: string, content: string) => void;
  initialData: Partial<Post> | null;
  onInitialDataConsumed: () => void;
  onStartConversation: (username: string) => void;
}

const Forum: React.FC<ForumProps> = ({ currentUser, posts, onCreatePost, onEditPost, onAddComment, initialData, onInitialDataConsumed, onStartConversation }) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | 'all'>('all');
  const [isPostModalOpen, setPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<ForumCategory>('info');
  const [postImage, setPostImage] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');

  useEffect(() => {
      if (selectedPost) {
          const updatedPost = posts.find(p => p.id === selectedPost.id);
          setSelectedPost(updatedPost || null);
      }
  }, [posts, selectedPost?.id]);

  useEffect(() => {
    if (initialData) {
      setPostTitle(initialData.title || '');
      setPostContent(initialData.content || '');
      setPostCategory(initialData.category || 'info');
      setPostImage(initialData.imageUrl || null);
      setEditingPost(null);
      setPostModalOpen(true);
      onInitialDataConsumed();
    }
  }, [initialData, onInitialDataConsumed]);

  const openNewPostModal = () => {
    setEditingPost(null); setPostTitle(''); setPostContent(''); setPostCategory('info'); setPostImage(null); setPostModalOpen(true);
  };
  
  const openEditPostModal = (post: Post) => {
    setEditingPost(post); setPostTitle(post.title); setPostContent(post.content); setPostCategory(post.category); setPostImage(post.imageUrl || null); setPostModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setPostImage(reader.result as string);
        reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = () => {
    if (postTitle.trim() && postContent.trim()) {
      if (editingPost) onEditPost(editingPost.id, postTitle, postContent, postCategory, postImage || undefined);
      else onCreatePost(postTitle, postContent, postCategory, postImage || undefined);
      setPostModalOpen(false);
    }
  };
  
  const handleAddComment = () => {
    if (selectedPost && newComment.trim()) {
      onAddComment(selectedPost.id, newComment);
      setNewComment('');
    }
  };

  const timeSince = (date: string) => { 
      const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
      let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + "년 전";
      interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + "달 전";
      interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + "일 전";
      interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + "시간 전";
      interval = seconds / 60; if (interval > 1) return Math.floor(interval) + "분 전";
      return "방금 전";
  };

  const notices = posts.filter(p => p.category === 'notice').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const regularPosts = selectedCategory === 'all' 
    ? posts.filter(p => p.category !== 'notice')
    : posts.filter(p => p.category === selectedCategory);
  
  const filteredPosts = selectedCategory === 'all' ? [...notices, ...regularPosts] : regularPosts;

  const AuthorLink: React.FC<{name: string}> = ({name}) => (
      <span 
        className={`font-semibold ${name !== currentUser.username ? 'text-blue-600 cursor-pointer hover:underline' : ''}`}
        onClick={name !== currentUser.username ? (e) => {e.stopPropagation(); onStartConversation(name)} : undefined}
      >
          {name}
      </span>
  );

  if (selectedPost) {
    return (
      <div className="flex-1 p-6 lg:p-8 bg-gray-50 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
            <button onClick={() => setSelectedPost(null)} className="text-primary hover:underline">&larr; 목록으로 돌아가기</button>
            {currentUser.username === selectedPost.author && (
                 <button onClick={() => openEditPostModal(selectedPost)} className="flex items-center space-x-1 text-sm bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200 transition-colors">
                    <PencilIcon className="w-4 h-4"/><span>수정</span>
                </button>
            )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
            <span className="text-sm font-semibold text-primary bg-primary/10 py-1 px-2 rounded-full">{ForumCategories[selectedPost.category]}</span>
            <h2 className="text-3xl font-bold text-text-primary mt-2">{selectedPost.title}</h2>
            <div className="text-sm text-text-secondary mt-2 mb-4 pb-4 border-b">
                <span>작성자: <AuthorLink name={selectedPost.author} /></span> &middot; <span>{timeSince(selectedPost.createdAt)}</span>
            </div>
            {selectedPost.imageUrl && <img src={selectedPost.imageUrl} alt="첨부 이미지" className="max-w-full md:max-w-lg rounded-lg my-4 shadow-sm" />}
            <p className="text-text-primary whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
        </div>
        <div className="mt-6">
            <h3 className="text-xl font-bold mb-4">댓글 ({selectedPost.comments.length})</h3>
            <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
                {selectedPost.comments.map(comment => (
                    <div key={comment.id} className="border-b pb-2">
                        <p className="text-sm"><AuthorLink name={comment.author} /> <span className="text-xs font-normal text-gray-500">{timeSince(comment.createdAt)}</span></p>
                        <p className="text-gray-700 pt-1">{comment.content}</p>
                    </div>
                ))}
                 {selectedPost.comments.length === 0 && <p className="text-gray-500">아직 댓글이 없습니다.</p>}
            </div>
            <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
                <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900" placeholder="댓글을 입력하세요..." rows={3}/>
                <button onClick={handleAddComment} className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">댓글 작성</button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-8 bg-gray-50 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-text-primary">커뮤니티</h3>
        <button onClick={openNewPostModal} className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow"><PlusIcon /><span>새 글 작성</span></button>
      </div>
      <div className="flex items-center space-x-2 border-b mb-4">
        <button onClick={() => setSelectedCategory('all')} className={`px-4 py-2 ${selectedCategory === 'all' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>전체</button>
        {(Object.keys(ForumCategories).filter(c => c !== 'notice') as ForumCategory[]).map(cat => (
             <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 ${selectedCategory === cat ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>{ForumCategories[cat]}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {filteredPosts.map(post => (
          <div key={post.id} onClick={() => setSelectedPost(post)} className={`p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer ${post.category === 'notice' ? 'bg-blue-50 border border-blue-200' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
                <h4 className="text-xl font-semibold text-primary/90 truncate flex items-center">
                    {post.category === 'notice' && <MegaphoneIcon className="w-5 h-5 mr-2 text-blue-500" />}
                    {post.title}
                </h4>
                <span className={`text-xs font-medium py-1 px-2 rounded-full flex-shrink-0 ml-4 ${post.category === 'notice' ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>{ForumCategories[post.category]}</span>
            </div>
            <div className="text-xs text-text-secondary mt-1">
              <span>작성자: {post.author}</span> &middot; <span>{timeSince(post.createdAt)}</span> &middot; <span>댓글 {post.comments.length}</span>
            </div>
          </div>
        ))}
         {filteredPosts.length === 0 && <div className="text-center py-10 text-gray-400">게시글이 없습니다.</div>}
      </div>
      <Modal isOpen={isPostModalOpen} onClose={() => setPostModalOpen(false)} title={editingPost ? "게시글 수정" : "새 글 작성"}>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">게시판</label>
                <select value={postCategory} onChange={e => setPostCategory(e.target.value as ForumCategory)} className="mt-1 w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900">
                    {currentUser.isAdmin && <option value="notice">{ForumCategories['notice']}</option>}
                    {(Object.keys(ForumCategories).filter(c => c !== 'notice') as ForumCategory[]).map(cat => <option key={cat} value={cat}>{ForumCategories[cat]}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">제목</label>
                <input type="text" value={postTitle} onChange={e => setPostTitle(e.target.value)} className="mt-1 w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900" />
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-700">내용</label>
                <textarea value={postContent} onChange={e => setPostContent(e.target.value)} className="mt-1 w-full p-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900" rows={8} />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">이미지 첨부</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                {postImage && <img src={postImage} alt="Preview" className="mt-2 rounded-md max-h-40 shadow-sm" />}
            </div>
             <div className="flex justify-end space-x-2 mt-4">
              <button type="button" onClick={() => setPostModalOpen(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">취소</button>
              <button type="button" onClick={handlePostSubmit} className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90">{editingPost ? '수정하기' : '작성하기'}</button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default Forum;