'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Décrivez votre service en détail...',
  minHeight = '200px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none p-3`,
        style: `min-height: ${minHeight}`,
      },
    },
  })

  const btn = (active: boolean) =>
    `p-1.5 rounded text-sm hover:bg-gray-200 transition-colors ${active ? 'bg-gray-200' : ''}`

  return (
    <div className="border border-input rounded-md overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 px-2 py-1.5 flex items-center gap-0.5 flex-wrap">
        <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}
          className={btn(!!editor?.isActive('bold'))}>
          <strong>G</strong>
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={btn(!!editor?.isActive('italic'))}>
          <em>I</em>
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()}
          className={btn(!!editor?.isActive('strike'))}>
          <s>S</s>
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${btn(!!editor?.isActive('heading', { level: 2 }))} font-bold text-xs`}>H2</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${btn(!!editor?.isActive('heading', { level: 3 }))} font-bold text-xs`}>H3</button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={btn(!!editor?.isActive('bulletList'))}>• Liste</button>
        <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={btn(!!editor?.isActive('orderedList'))}>1. Liste</button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={btn(!!editor?.isActive('blockquote'))}>❝</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
