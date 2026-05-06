import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, List, ListOrdered, Heading2, Heading3,
  Quote, Link as LinkIcon, Image as ImageIcon, Undo, Redo,
} from 'lucide-react';
import { useEffect } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  onImageUploadRequest?: () => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, onImageUploadRequest, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Image.configure({ HTMLAttributes: { class: 'rounded-lg my-4 max-w-full h-auto' } }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[300px] focus:outline-none px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
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
        <Btn label="Link" active={editor.isActive('link')} onClick={addLink}><LinkIcon className="h-4 w-4" /></Btn>
        {onImageUploadRequest && (
          <Btn label="Insert image" active={false} onClick={onImageUploadRequest}><ImageIcon className="h-4 w-4" /></Btn>
        )}
        <div className="ml-auto flex gap-1">
          <Btn label="Undo" active={false} onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></Btn>
          <Btn label="Redo" active={false} onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></Btn>
        </div>
      </div>
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}

export function insertImageIntoEditor(editor: any, url: string) {
  editor?.chain().focus().setImage({ src: url }).run();
}
