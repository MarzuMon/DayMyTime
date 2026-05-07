import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Youtube } from '@tiptap/extension-youtube';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, List, ListOrdered, Heading2, Heading3,
  Quote, Link as LinkIcon, Image as ImageIcon, Undo, Redo,
  Table as TableIcon, Code2, Youtube as YoutubeIcon,
} from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle } from 'react';

const lowlight = createLowlight(common);

export interface RichTextEditorHandle {
  insertImage: (url: string) => void;
}

interface Props {
  value: string;
  onChange: (html: string) => void;
  onImageUploadRequest?: () => void;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(
  ({ value, onChange, onImageUploadRequest }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({ codeBlock: false }),
        Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
        Image.configure({ HTMLAttributes: { class: 'rounded-lg my-4 max-w-full h-auto' } }),
        Table.configure({ resizable: true, HTMLAttributes: { class: 'border-collapse my-4 w-full' } }),
        TableRow,
        TableHeader.configure({ HTMLAttributes: { class: 'border border-border bg-muted px-2 py-1 font-semibold' } }),
        TableCell.configure({ HTMLAttributes: { class: 'border border-border px-2 py-1' } }),
        Youtube.configure({ width: 640, height: 360, HTMLAttributes: { class: 'rounded-lg my-4 max-w-full' } }),
        CodeBlockLowlight.configure({
          lowlight,
          HTMLAttributes: { class: 'bg-muted rounded-lg p-3 my-4 text-xs overflow-x-auto' },
        }),
      ],
      content: value,
      editorProps: {
        attributes: {
          class: 'prose prose-sm dark:prose-invert max-w-none min-h-[300px] focus:outline-none px-4 py-3',
        },
      },
      onUpdate: ({ editor }) => onChange(editor.getHTML()),
    });

    useImperativeHandle(ref, () => ({
      insertImage: (url: string) => {
        editor?.chain().focus().setImage({ src: url }).run();
      },
    }), [editor]);

    useEffect(() => {
      if (editor && value && value !== editor.getHTML()) {
        editor.commands.setContent(value);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, editor]);

    if (!editor) return null;

    const addLink = () => {
      const url = window.prompt('Enter URL:');
      if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };
    const addYoutube = () => {
      const url = window.prompt('YouTube URL:');
      if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
    };
    const addTable = () => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    const Btn = ({ active, onClick, children, label }: any) => (
      <Button
        type="button" size="sm" variant={active ? 'default' : 'ghost'}
        onClick={onClick} aria-label={label} className="h-8 w-8 p-0"
      >
        {children}
      </Button>
    );

    return (
      <div className="border border-input rounded-md bg-background">
        <div className="flex flex-wrap gap-1 border-b border-border p-2">
          <Btn label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Btn>
          <Btn label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
          <Btn label="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Btn>
          <Btn label="H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Btn>
          <Btn label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Btn>
          <Btn label="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Btn>
          <Btn label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Btn>
          <Btn label="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 className="h-4 w-4" /></Btn>
          <Btn label="Table" active={editor.isActive('table')} onClick={addTable}><TableIcon className="h-4 w-4" /></Btn>
          <Btn label="YouTube" active={false} onClick={addYoutube}><YoutubeIcon className="h-4 w-4" /></Btn>
          <Btn label="Link" active={editor.isActive('link')} onClick={addLink}><LinkIcon className="h-4 w-4" /></Btn>
          {onImageUploadRequest && (
            <Btn label="Insert image" active={false} onClick={onImageUploadRequest}><ImageIcon className="h-4 w-4" /></Btn>
          )}
          <div className="ml-auto flex gap-1">
            <Btn label="Undo" active={false} onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></Btn>
            <Btn label="Redo" active={false} onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></Btn>
          </div>
        </div>
        <EditorContent editor={editor} />
      </div>
    );
  }
);
RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
