import React, { useEffect, useRef, useState, useMemo } from 'react';
import { customEmojis } from '@/lib/customEmojis';

interface CustomEmojiPickerProps {
    onEmojiClick: (emojiUrl: string) => void;
    onClose: () => void;
}

const ITEM_SIZE = 44; // w-10 h-10 + padding + gap
const ITEMS_PER_ROW = 8;
const CONTAINER_HEIGHT = 256; // h-64

export const CustomEmojiPicker: React.FC<CustomEmojiPickerProps> = ({ onEmojiClick, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

    // Calculate virtual scrolling parameters
    const totalRows = Math.ceil(customEmojis.length / ITEMS_PER_ROW);
    const totalHeight = totalRows * ITEM_SIZE;

    const startRow = Math.max(0, Math.floor(scrollTop / ITEM_SIZE) - 2);
    const endRow = Math.min(totalRows, Math.ceil((scrollTop + CONTAINER_HEIGHT) / ITEM_SIZE) + 2);

    const visibleEmojis = useMemo(() => {
        const startIndex = startRow * ITEMS_PER_ROW;
        const endIndex = endRow * ITEMS_PER_ROW;
        return customEmojis.slice(startIndex, endIndex).map((emoji, idx) => ({
            ...emoji,
            originalIndex: startIndex + idx
        }));
    }, [startRow, endRow]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    const handleImageLoad = (imgUrl: string) => {
        setLoadedImages(prev => new Set(prev).add(imgUrl));
    };

    return (
        <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#333] rounded-lg shadow-xl z-50">
            <div className="p-3 border-b border-gray-200 dark:border-[#333] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">رموز مخصصة</h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    ✕
                </button>
            </div>
            <div
                ref={containerRef}
                className="w-80 h-64 overflow-y-auto p-2"
                onScroll={handleScroll}
                style={{ overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}
            >
                <div style={{ height: totalHeight, position: 'relative' }}>
                    <div
                        className="grid grid-cols-8 gap-1"
                        style={{
                            position: 'absolute',
                            top: startRow * ITEM_SIZE,
                            left: 0,
                            right: 0
                        }}
                    >
                        {visibleEmojis.map((emoji) => (
                            <button
                                key={emoji.originalIndex}
                                onClick={() => onEmojiClick(emoji.imgUrl)}
                                className="w-10 h-10 p-1 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded transition"
                                title={emoji.id}
                            >
                                <img
                                    src={emoji.imgUrl}
                                    alt={emoji.id}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                    onLoad={() => handleImageLoad(emoji.imgUrl)}
                                    style={{
                                        opacity: loadedImages.has(emoji.imgUrl) ? 1 : 0,
                                        transition: 'opacity 0.2s'
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
