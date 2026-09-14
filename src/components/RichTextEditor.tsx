'use client';

import { useEffect, useRef } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import styles from './RichTextEditor.module.css';

type RichTextEditorProps = {
  id: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  describedBy?: string;
  ariaLabel: string;
};

export function RichTextEditor({ id, value, onChange, placeholder, describedBy, ariaLabel }: RichTextEditorProps) {
  const lastKnownValue = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        listItem: false,
        listKeymap: false,
        link: false,
        orderedList: false,
        strike: false,
        dropcursor: false,
        gapcursor: false,
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
    }),
  });

  return (
    <div className={styles.wrapper}>
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
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
