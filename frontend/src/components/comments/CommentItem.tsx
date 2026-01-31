import React, { useState, useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Smile, Sparkles, MoreVertical, Edit2, Trash2, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useAuthStore } from '@/stores/auth-store';

import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CustomEmojiPicker } from './CustomEmojiPicker';
import { RichTextInput } from './RichTextInput';

interface Comment {
    id: number;
    content: string;
    user_id: number;
    user: {
        id: number;
        name: string;
        avatar?: string;
    };
    created_at: string;
    likes: number;
    dislikes: number;
    user_interaction?: boolean | null; // true = like, false = dislike
    children?: Comment[];
    parent_id?: number | null;
    episode_id?: number; // Optional on frontend interface if not always populated, but needed for reply
}

interface CommentItemProps {
    comment: Comment;
    depth?: number;
    onReplySuccess: () => void;
    onUpdateSuccess: (comment: Comment) => void;
    onDeleteSuccess: (id: number) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, depth = 0, onReplySuccess, onUpdateSuccess, onDeleteSuccess }) => {
    const { user } = useAuthStore();
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [editText, setEditText] = useState(comment.content);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showCustomEmojiPicker, setShowCustomEmojiPicker] = useState(false);
    const [currentEmojiTarget, setCurrentEmojiTarget] = useState<'reply' | 'edit'>('reply');
    const emojiRef = useRef<HTMLDivElement>(null);
    const customEmojiRef = useRef<HTMLDivElement>(null);
    const replyInputRef = useRef<HTMLDivElement>(null);
    const editInputRef = useRef<HTMLDivElement>(null);

    // Optimistic UI state
    const [likes, setLikes] = useState(comment.likes);
    const [dislikes, setDislikes] = useState(comment.dislikes);
    const [interaction, setInteraction] = useState<boolean | null | undefined>(comment.user_interaction);

    useEffect(() => {
        // Sync if props change (though typically we manage state locally after init)
        setLikes(comment.likes);
        setDislikes(comment.dislikes);
        setInteraction(comment.user_interaction);
    }, [comment]);

    // Click outside emoji picker
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
            if (customEmojiRef.current && !customEmojiRef.current.contains(event.target as Node)) {
                setShowCustomEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getAvatarUrl = (avatar?: string) => {
        if (!avatar) return '';
        if (avatar.startsWith('http')) return avatar;
        return avatar.startsWith('/') ? avatar : `/${avatar}`;
    };

    // Render content with custom emojis
    const renderContent = (content: string) => {
        console.log('Rendering content:', content);
        // Parse ![emoji](/custom-emojis/filename.png) pattern - match until file extension
        const parts = content.split(/(!\[emoji\]\(.*?\.(?:png|jpg|jpeg)\))/);
        console.log('Split parts:', parts);
        return parts.map((part, index) => {
            const match = part.match(/!\[emoji\]\((.*?\.(?:png|jpg|jpeg))\)/);
            if (match) {
                const emojiUrl = match[1].replace('/storage/', '/');
                console.log('Matched emoji URL:', emojiUrl);
                return (
                    <img
                        key={index}
                        src={emojiUrl}
                        alt="emoji"
                        className="inline-block w-6 h-6 align-middle mx-0.5"
                    />
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    const toggleLike = async (isLike: boolean) => {
        if (!user) return alert('يجب تسجيل الدخول للتفاعل');

        const prevInteraction = interaction;
        const prevLikes = likes;
        const prevDislikes = dislikes;

        // Optimistic Update
        if (interaction === isLike) {
            // Toggle off
            setInteraction(null);
            if (isLike) setLikes(prev => prev - 1);
            else setDislikes(prev => prev - 1);
        } else {
            // Toggle on or switch
            if (interaction === true) setLikes(prev => prev - 1);
            if (interaction === false) setDislikes(prev => prev - 1);

            setInteraction(isLike);
            if (isLike) setLikes(prev => prev + 1);
            else setDislikes(prev => prev + 1);
        }

        try {
            await api.post(`/comments/${comment.id}/like`, { is_like: isLike });
        } catch (error) {
            // Revert
            setInteraction(prevInteraction);
            setLikes(prevLikes);
            setDislikes(prevDislikes);
        }
    };

    const handleReply = async () => {
        if (!replyText.trim()) return;
        try {
            await api.post(`/episodes/${comment.episode_id || 0}/comments`, { // episode_id usually from parent context, wait. Comments typically have episode_id
                content: replyText,
                parent_id: comment.id,
                episode_id: comment.episode_id // We need episode ID here
            });
            setReplyText('');
            setIsReplying(false);
            setIsExpanded(true);
            onReplySuccess();
        } catch (error) {
            console.error("Failed to reply", error);
        }
    };

    // Note: Comment type in props might not have episode_id field if we didn't add it to interface clearly above.
    // The Backend Comment struct has EpisodeID. Frontend needs it.

    const handleEdit = async () => {
        if (!editText.trim()) return;
        try {
            const res = await api.put(`/comments/${comment.id}`, { content: editText });
            setIsEditing(false);
            onUpdateSuccess(res.data);
        } catch (error) {
            console.error("Failed to update", error);
        }
    };

    const handleDelete = async () => {
        if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return;
        try {
            await api.delete(`/comments/${comment.id}`);
            onDeleteSuccess(comment.id);
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        if (currentEmojiTarget === 'reply') {
            if (replyInputRef.current && (replyInputRef.current as any).insertText) {
                (replyInputRef.current as any).insertText(emojiData.emoji);
            } else {
                setReplyText(prev => prev + emojiData.emoji);
            }
        } else {
            if (editInputRef.current && (editInputRef.current as any).insertText) {
                (editInputRef.current as any).insertText(emojiData.emoji);
            } else {
                setEditText(prev => prev + emojiData.emoji);
            }
        }
        setShowEmojiPicker(false);
    };

    const onCustomEmojiClick = (emojiUrl: string) => {
        if (currentEmojiTarget === 'reply') {
            if (replyInputRef.current && (replyInputRef.current as any).insertEmoji) {
                (replyInputRef.current as any).insertEmoji(emojiUrl);
            }
        } else {
            if (editInputRef.current && (editInputRef.current as any).insertEmoji) {
                (editInputRef.current as any).insertEmoji(emojiUrl);
            }
        }
    };

    return (
        <div className={`group relative ${depth > 0 ? 'mr-4 md:mr-8 border-r-2 border-gray-100 dark:border-[#333] pr-4' : ''}`}>
            <div className="flex gap-3 text-right" dir="rtl">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-[#272727] shadow-sm">
                        {comment.user.avatar ? (
                            <img src={getAvatarUrl(comment.user.avatar)} alt={comment.user.name} className="object-cover w-full h-full" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-sm">
                                {comment.user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#0f0f0f] dark:text-[#f1f1f1] hover:text-blue-500 cursor-pointer transition">
                                {comment.user.name}
                            </span>
                            <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ar })}
                            </span>
                        </div>

                        {/* Actions Dropdown */}
                        {user && user.id === comment.user_id && (
                            <div className="relative group/menu">
                                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] transition">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                                <div className="absolute left-0 top-full w-40 bg-white dark:bg-black rounded-none shadow-xl border border-gray-100 dark:border-[#333] py-2 hidden group-hover/menu:block z-20">
                                    <button onClick={() => setIsEditing(true)} className="w-full text-right px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#272727] flex items-center gap-3">
                                        <Edit2 className="w-5 h-5" /> تعديل
                                    </button>
                                    <button onClick={handleDelete} className="w-full text-right px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3">
                                        <Trash2 className="w-5 h-5" /> حذف
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Text Content */}
                    {!isEditing ? (
                        <p className="text-sm text-[#0f0f0f] dark:text-[#f1f1f1] leading-6">{renderContent(comment.content)}</p>
                    ) : (
                        <div className="mt-2 text-right">
                            <div className="relative">
                                <RichTextInput
                                    ref={editInputRef}
                                    value={editText}
                                    onChange={setEditText}
                                    className="w-full bg-gray-50 dark:bg-[#272727] border border-transparent focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#1f1f1f] rounded-xl py-2 px-3 text-sm text-[#0f0f0f] dark:text-[#f1f1f1] resize-none outline-none"
                                />
                                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                                    <div className="relative" ref={emojiRef}>
                                        <button onClick={() => { setCurrentEmojiTarget('edit'); setShowEmojiPicker(!showEmojiPicker); }} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-500">
                                            <Smile className="w-4 h-4" />
                                        </button>
                                        {showEmojiPicker && currentEmojiTarget === 'edit' && (
                                            <div className="absolute bottom-full mb-2 left-0 z-50">
                                                <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.AUTO} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative" ref={customEmojiRef}>
                                        <button onClick={() => { setCurrentEmojiTarget('edit'); setShowCustomEmojiPicker(!showCustomEmojiPicker); }} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-500" title="رموز مخصصة">
                                            <Sparkles className="w-4 h-4" />
                                        </button>
                                        {showCustomEmojiPicker && currentEmojiTarget === 'edit' && (
                                            <CustomEmojiPicker onEmojiClick={onCustomEmojiClick} onClose={() => setShowCustomEmojiPicker(false)} />
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-2">
                                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-[#272727] rounded-full transition">إلغاء</button>
                                <button onClick={handleEdit} className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-full transition shadow-sm">حفظ</button>
                            </div>
                        </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => toggleLike(true)} className={`flex items-center gap-1.5 transition group/btn ${interaction === true ? 'text-blue-600 dark:text-blue-500' : 'text-gray-500 dark:text-[#aaa] hover:text-blue-600 dark:hover:text-blue-500'}`}>
                            <ThumbsUp className={`w-4 h-4 transition-transform ${interaction === true ? 'fill-current' : ''}`} />
                            <span className="text-xs font-bold">{likes}</span>
                        </button>
                        <button onClick={() => toggleLike(false)} className={`flex items-center gap-1.5 transition group/btn ${interaction === false ? 'text-red-600 dark:text-red-500' : 'text-gray-500 dark:text-[#aaa] hover:text-red-600 dark:hover:text-red-500'}`}>
                            <ThumbsDown className={`w-4 h-4 transition-transform ${interaction === false ? 'fill-current' : ''}`} />
                            <span className="text-xs font-bold">{dislikes}</span>
                        </button>
                        <button onClick={() => setIsReplying(!isReplying)} className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-[#aaa] hover:bg-gray-100 dark:hover:bg-[#272727] px-2 py-1 rounded-full transition">
                            <CornerDownRight className="w-3.5 h-3.5" /> رد
                        </button>
                    </div>

                    {/* Reply Form */}
                    {isReplying && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1">
                                    <div className="relative">
                                        <RichTextInput
                                            ref={replyInputRef}
                                            value={replyText}
                                            onChange={setReplyText}
                                            placeholder="اكتب ردك هنا..."
                                            className="w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-none py-2 px-0 text-sm text-[#0f0f0f] dark:text-[#f1f1f1] resize-none outline-none"
                                        />
                                        <div className="absolute bottom-2 left-2 flex items-center gap-1">
                                            <div className="relative" ref={emojiRef}>
                                                <button onClick={() => { setCurrentEmojiTarget('reply'); setShowEmojiPicker(!showEmojiPicker); }} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-500">
                                                    <Smile className="w-4 h-4" />
                                                </button>
                                                {showEmojiPicker && currentEmojiTarget === 'reply' && (
                                                    <div className="absolute bottom-full mb-2 left-0 z-50">
                                                        <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.AUTO} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="relative" ref={customEmojiRef}>
                                                <button onClick={() => { setCurrentEmojiTarget('reply'); setShowCustomEmojiPicker(!showCustomEmojiPicker); }} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-500" title="رموز مخصصة">
                                                    <Sparkles className="w-4 h-4" />
                                                </button>
                                                {showCustomEmojiPicker && currentEmojiTarget === 'reply' && (
                                                    <CustomEmojiPicker onEmojiClick={onCustomEmojiClick} onClose={() => setShowCustomEmojiPicker(false)} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 mt-2">
                                        <button onClick={() => setIsReplying(false)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-[#272727] rounded-full transition">إلغاء</button>
                                        <button onClick={handleReply} disabled={!replyText} className={`px-3 py-1.5 text-xs font-bold rounded-full transition shadow-sm ${replyText ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 dark:bg-[#272727] text-gray-500 cursor-not-allowed'}`}>رد</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Emoji Picker Popover */}
                    {showEmojiPicker && (
                        <div ref={emojiRef} className="absolute z-50 mt-2 shadow-xl">
                            <EmojiPicker
                                onEmojiClick={onEmojiClick}
                                theme={Theme.AUTO}
                            />
                        </div>
                    )}

                    {/* Nested Replies */}
                    {comment.children && comment.children.length > 0 && (
                        <div className="mt-3">
                            <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-full transition w-fit mb-2">
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                <span>{isExpanded ? 'إخفاء الردود' : `عرض ${comment.children.length} ردود`}</span>
                            </button>
                            {isExpanded && (
                                <div className="space-y-4">
                                    {comment.children.map(child => (
                                        <CommentItem
                                            key={child.id}
                                            comment={{ ...child, episode_id: comment.episode_id }} // Pass episode_id down if missing 
                                            depth={depth + 1}
                                            onReplySuccess={onReplySuccess}
                                            onUpdateSuccess={onUpdateSuccess}
                                            onDeleteSuccess={onDeleteSuccess}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
