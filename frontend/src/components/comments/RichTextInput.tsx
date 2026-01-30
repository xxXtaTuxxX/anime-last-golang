import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface RichTextInputProps {
    value: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    placeholder?: string;
    className?: string;
}

export const RichTextInput = forwardRef<HTMLDivElement, RichTextInputProps>(({
    value,
    onChange,
    onFocus,
    placeholder,
    className
}, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const isUpdatingRef = useRef(false);

    // Render content with emoji images
    const renderContent = (content: string) => {
        if (!content) return '';
        // Convert ![emoji](url) to <img> tags
        return content.replace(
            /!\[emoji\]\((.*?\.(?:png|jpg|jpeg))\)/g,
            '<img src="$1" alt="emoji" class="inline-block w-6 h-6 align-middle mx-0.5" draggable="false" />'
        );
    };

    // Extract plain text with emoji markers from HTML
    const extractContent = (html: string): string => {
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Convert <img> tags back to ![emoji](url) format
        const images = temp.querySelectorAll('img');
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src && src.includes('/custom-emojis/')) {
                const placeholder = document.createElement('span');
                placeholder.textContent = `![emoji](${src})`;
                img.replaceWith(placeholder);
            }
        });

        const result = temp.textContent || '';
        console.log('Extracted content:', result);
        return result;
    };

    // Update editor content when value changes externally
    useEffect(() => {
        if (editorRef.current && !isUpdatingRef.current) {
            const currentContent = extractContent(editorRef.current.innerHTML);
            if (currentContent !== value) {
                const rendered = renderContent(value);
                editorRef.current.innerHTML = rendered || '';
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            isUpdatingRef.current = true;
            const content = extractContent(editorRef.current.innerHTML);
            onChange(content);
            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 0);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        insertEmoji: (emojiUrl: string) => {
            if (editorRef.current) {
                editorRef.current.focus();
                const img = document.createElement('img');
                img.src = emojiUrl;
                img.alt = 'emoji';
                img.className = 'inline-block w-6 h-6 align-middle mx-0.5';
                img.draggable = false;

                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(img);
                    range.setStartAfter(img);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                } else {
                    editorRef.current.appendChild(img);
                }

                handleInput();
            }
        },
        insertText: (text: string) => {
            if (editorRef.current) {
                editorRef.current.focus();
                document.execCommand('insertText', false, text);
                handleInput();
            }
        }
    } as any));

    return (
        <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onFocus={onFocus}
            onPaste={handlePaste}
            data-placeholder={placeholder}
            className={`${className} [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-gray-500 [&:empty:before]:dark:text-gray-600`}
            style={{ minHeight: '50px', maxHeight: '200px', overflowY: 'auto' }}
        />
    );
});

RichTextInput.displayName = 'RichTextInput';
