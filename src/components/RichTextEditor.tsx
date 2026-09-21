'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { LinkSimple, ListBullets, ListNumbers } from '@phosphor-icons/react';
import styles from './RichTextEditor.module.css';

type RichTextEditorProps = {
  id: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  describedBy?: string;
  ariaLabel: string;
  /** Minimum height of the editable area, in px. Grows beyond this if content is taller. */
  minHeight?: number;
};

export function RichTextEditor({ id, value, onChange, placeholder, describedBy, ariaLabel, minHeight }: RichTextEditorProps) {
  const lastKnownValue = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        strike: false,
        dropcursor: false,
        gapcursor: false,
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: updatedEditor }) => {
      const html = updatedEditor.getHTML();
      lastKnownValue.current = html;
      onChange(html);
    },
    editorProps: {
      attributes: {
        id,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': ariaLabel,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        class: styles.editorContent,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== lastKnownValue.current && value !== editor.getHTML()) {
      lastKnownValue.current = value;
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const formatState = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor?.isActive('bold') ?? false,
      italic: ctx.editor?.isActive('italic') ?? false,
      underline: ctx.editor?.isActive('underline') ?? false,
      bulletList: ctx.editor?.isActive('bulletList') ?? false,
      orderedList: ctx.editor?.isActive('orderedList') ?? false,
      link: ctx.editor?.isActive('link') ?? false,
    }),
  });

  const handleLink = () => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('Link URL');
    if (!url || !url.trim()) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  return (
    <div
      className={styles.wrapper}
      style={minHeight ? ({ '--content-min-height': `${minHeight}px` } as CSSProperties) : undefined}
    >
      <div className={styles.toolbar} role="toolbar" aria-label={`${ariaLabel} formatting`}>
        <button
          type="button"
          className={styles.toolButton}
          aria-pressed={formatState?.bold ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
          <span className={styles.srOnly}>Bold</span>
        </button>
        <button
          type="button"
          className={styles.toolButton}
          aria-pressed={formatState?.italic ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
          <span className={styles.srOnly}>Italic</span>
        </button>
        <button
          type="button"
          className={styles.toolButton}
          aria-pressed={formatState?.underline ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
          <span className={styles.srOnly}>Underline</span>
        </button>
        <span className={styles.toolbarDivider} aria-hidden="true" />
        <button
          type="button"
          className={styles.toolButton}
          aria-pressed={formatState?.bulletList ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <ListBullets size={18} aria-hidden="true" />
          <span className={styles.srOnly}>Bulleted list</span>
        </button>
        <button
          type="button"
          className={styles.toolButton}
          aria-pressed={formatState?.orderedList ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListNumbers size={18} aria-hidden="true" />
          <span className={styles.srOnly}>Numbered list</span>
        </button>
        <button
          type="button"
          className={styles.toolButton}
          aria-pressed={formatState?.link ?? false}
          disabled={!editor}
          onClick={handleLink}
        >
          <LinkSimple size={18} aria-hidden="true" />
          <span className={styles.srOnly}>{formatState?.link ? 'Remove link' : 'Add link'}</span>
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
