import { useCallback, useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import TextStyle from '@tiptap/extension-text-style'
import { Extension } from '@tiptap/core'
import Color from '@tiptap/extension-color'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import { useToast } from './ui/use-toast'
import { apiPost } from '../lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Button } from './ui/button'

// Create a custom FontSize extension
const FontSize = Extension.create({
  name: 'fontSize',
  
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      }
    ]
  },
  
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
      },
    }
  },
})

// Font size dropdown component
const FontSizeDropdown = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState('Default')
  const savedSelection = useRef(null)
  
  // Updated font sizes to include headings
  const fontSizes = [
    { label: 'Default', value: 'default' },
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
    { label: 'X-Large', value: 'x-large' },
    { label: 'Heading 1', value: 'h1' },
    { label: 'Heading 2', value: 'h2' },
    { label: 'Heading 3', value: 'h3' },
  ]
  
  const toggleDropdown = () => {
    // Save selection before opening dropdown
    if (!isOpen && editor) {
      savedSelection.current = editor.view.state.selection
    }
    setIsOpen(!isOpen)
  }
  
  // Update the handleSizeSelect function to handle headings and reset font sizes
  const handleSizeSelect = (size) => {
    setIsOpen(false)
    setSelectedSize(size.label)
    
    // Restore selection before applying formatting
    if (savedSelection.current && editor) {
      const { from, to } = savedSelection.current
      editor.commands.setTextSelection({ from, to })
    }
    
    // Handle heading options - need to clear font sizes when switching to a heading
    if (size.value === 'h1' || size.value === 'h2' || size.value === 'h3') {
      // First, remove any font size
      editor.chain().focus().unsetFontSize().run()
      
      // Then apply heading (or remove it if already active at the same level)
      if (size.value === 'h1') {
        editor.chain().focus().toggleHeading({ level: 1 }).run()
      } else if (size.value === 'h2') {
        editor.chain().focus().toggleHeading({ level: 2 }).run()
      } else if (size.value === 'h3') {
        editor.chain().focus().toggleHeading({ level: 3 }).run()
      }
      return
    }
    
    // When applying regular font sizes, first remove any headings
    if (editor.isActive('heading')) {
      editor.chain().focus().toggleHeading({ 
        level: editor.getAttributes('heading').level 
      }).run()
    }
    
    // Then handle regular font sizes
    if (size.value === 'default') {
      // Remove font-size attribute
      editor.chain().focus().unsetFontSize().run()
    } else {
      editor.chain().focus().setFontSize(size.value).run()
    }
  }
  
  // Update selected size based on current editor state
  useEffect(() => {
    if (!editor) return

    const updateLabel = () => {
      // Check for headings first
      if (editor.isActive('heading', { level: 1 })) {
        setSelectedSize('Heading 1')
      } else if (editor.isActive('heading', { level: 2 })) {
        setSelectedSize('Heading 2')
      } else if (editor.isActive('heading', { level: 3 })) {
        setSelectedSize('Heading 3')
      } else {
        // Check for font sizes
        const attrs = editor.getAttributes('textStyle')
        if (attrs.fontSize) {
          const matchingSize = fontSizes.find(s => s.value === attrs.fontSize)
          if (matchingSize) {
            setSelectedSize(matchingSize.label)
          }
        } else {
          setSelectedSize('Default')
        }
      }
    }
    
    // Call updateLabel initially and also subscribe to editor state changes
    updateLabel()
    
    // Set up a transaction handler to update the label whenever the editor state changes
    const handler = ({ editor }) => {
      updateLabel()
    }
    
    if (editor) {
      editor.on('transaction', handler)
      
      // Clean up event handler
      return () => {
        editor.off('transaction', handler)
      }
    }
  }, [editor])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event) => {
      if (!event.target.closest('.font-size-dropdown')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  return (
    <div className="relative font-size-dropdown">
      <button
        type="button"
        onClick={toggleDropdown}
        className="p-1.5 hover:bg-accent/50 flex items-center"
        title="Text Style"
        onMouseDown={(e) => e.preventDefault()} // Prevent default to maintain selection
      >
        <span className="sr-only">Text Style</span>
        <span className="text-xs mr-1">{selectedSize}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 bg-background border border-input w-40 z-50 shadow-md">
          <ul className="py-1">
            {fontSizes.map(size => (
              <li 
                key={size.value}
                className={`px-3 py-1 text-sm hover:bg-accent cursor-pointer ${
                  (size.value === 'h1' || size.value === 'h2' || size.value === 'h3') ? 
                  'mt-2 border-t border-input pt-2' : ''
                }`}
                onClick={() => handleSizeSelect(size)}
                onMouseDown={(e) => e.preventDefault()} // Prevent default to maintain selection
              >
                {size.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Text alignment dropdown component
const AlignmentDropdown = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAlign, setSelectedAlign] = useState('left')
  const savedSelection = useRef(null)
  
  const alignOptions = [
    { label: 'Left', value: 'left', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="15" y2="12"></line>
        <line x1="3" y1="18" x2="18" y2="18"></line>
      </svg>
    )},
    { label: 'Center', value: 'center', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="6" y1="12" x2="18" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    )},
    { label: 'Right', value: 'right', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="9" y1="12" x2="21" y2="12"></line>
        <line x1="6" y1="18" x2="21" y2="18"></line>
      </svg>
    )},
    { label: 'Justify', value: 'justify', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    )},
  ]
  
  const toggleDropdown = () => {
    // Save selection before opening dropdown
    if (!isOpen && editor) {
      savedSelection.current = editor.view.state.selection
    }
    setIsOpen(!isOpen)
  }
  
  const handleAlignSelect = (align) => {
    setIsOpen(false)
    setSelectedAlign(align.value)
    
    // Restore selection before applying formatting
    if (savedSelection.current && editor) {
      const { from, to } = savedSelection.current
      editor.commands.setTextSelection({ from, to })
    }
    
    editor.chain().focus().setTextAlign(align.value).run()
  }
  
  // Update selected alignment based on current editor state
  useEffect(() => {
    if (!editor) return
    
    const updateAlignment = () => {
      const alignments = ['left', 'center', 'right', 'justify']
      for (const align of alignments) {
        if (editor.isActive({ textAlign: align })) {
          setSelectedAlign(align)
          break
        }
      }
    }
    
    // Call updateAlignment initially and subscribe to editor state changes
    updateAlignment()
    
    const handler = ({ editor }) => {
      updateAlignment()
    }
    
    if (editor) {
      editor.on('transaction', handler)
      
      return () => {
        editor.off('transaction', handler)
      }
    }
  }, [editor])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event) => {
      if (!event.target.closest('.alignment-dropdown')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  const currentAlignOption = alignOptions.find(option => option.value === selectedAlign)
  
  return (
    <div className="relative alignment-dropdown">
      <button
        type="button"
        onClick={toggleDropdown}
        className={`p-1.5 ${editor.isActive({ textAlign: selectedAlign }) ? 'bg-accent' : 'hover:bg-accent/50'}`}
        title="Text Alignment"
        onMouseDown={(e) => e.preventDefault()} // Prevent default to maintain selection
      >
        <span className="sr-only">Text Alignment</span>
        {currentAlignOption?.icon}
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 bg-background border border-input w-32 z-50 shadow-md">
          <ul className="py-1">
            {alignOptions.map(option => (
              <li 
                key={option.value}
                className={`px-3 py-1 text-sm hover:bg-accent cursor-pointer flex items-center ${
                  selectedAlign === option.value ? 'bg-accent/50' : ''
                }`}
                onClick={() => handleAlignSelect(option)}
                onMouseDown={(e) => e.preventDefault()} // Prevent default to maintain selection
              >
                <div className="mr-2">{option.icon}</div>
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Link dialog component for inserting/editing links
const LinkDialog = ({ editor, isOpen, setIsOpen }) => {
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const inputRef = useRef(null)
  
  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Check if we're editing an existing link
      const linkMark = editor.getAttributes('link')
      if (linkMark.href) {
        setUrl(linkMark.href)
        
        // Get the selected text
        const { from, to } = editor.view.state.selection
        const selectedText = editor.view.state.doc.textBetween(from, to)
        setText(selectedText)
      } else {
        // Default for new link - empty instead of 'https://'
        setUrl('')
        const { from, to } = editor.view.state.selection
        const selectedText = editor.view.state.doc.textBetween(from, to)
        setText(selectedText)
      }
      
      // Focus the URL input when dialog opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }
      }, 100)
    }
  }, [isOpen, editor])
  
  const saveLink = useCallback(() => {
    // Validate URL
    if (url.trim() === '') {
      return
    }
    
    let finalUrl = url;
    
    // Add https:// if protocol is missing
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }
    
    // If there was text entered and no selection, insert new text with link
    if (text && editor.view.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: text,
          marks: [
            {
              type: 'link',
              attrs: { href: finalUrl, target: '_blank' } // Restore target="_blank"
            }
          ]
        })
        .run()
    } else if (!editor.view.state.selection.empty) {
      // Apply link to existing selection
      editor
        .chain()
        .focus()
        .setLink({ href: finalUrl, target: '_blank' }) // Restore target="_blank"
        .run()
    } else {
      // Just insert the URL as a link if no selection and no text provided
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: text || finalUrl,
          marks: [
            {
              type: 'link',
              attrs: { href: finalUrl, target: '_blank' } // Restore target="_blank"
            }
          ]
        })
        .run()
    }
    
    setIsOpen(false)
  }, [editor, url, text, setIsOpen])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
          <DialogDescription>
            Add a link to your content. Links will open in a new tab.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              ref={inputRef}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="text">Text</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Link text"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveLink}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Editor toolbar buttons
const EditorMenuBar = ({ editor, onImageUpload, uploading }) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  
  if (!editor) return null
  
  // Helper function to prevent losing selection
  const handleButtonMouseDown = (e) => {
    e.preventDefault()
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-input bg-secondary">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 ${editor.isActive('bold') ? 'bg-accent' : 'hover:bg-accent/50'}`}
        title="Bold"
        onMouseDown={handleButtonMouseDown}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
        </svg>
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 ${editor.isActive('italic') ? 'bg-accent' : 'hover:bg-accent/50'}`}
        title="Italic"
        onMouseDown={handleButtonMouseDown}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="4" x2="10" y2="4"></line>
          <line x1="14" y1="20" x2="5" y2="20"></line>
          <line x1="15" y1="4" x2="9" y2="20"></line>
        </svg>
      </button>
      
      {/* Add Underline button */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 ${editor.isActive('underline') ? 'bg-accent' : 'hover:bg-accent/50'}`}
        title="Underline"
        onMouseDown={handleButtonMouseDown}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
          <line x1="4" y1="21" x2="20" y2="21"></line>
        </svg>
      </button>

      {/* Add Strikethrough button */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 ${editor.isActive('strike') ? 'bg-accent' : 'hover:bg-accent/50'}`}
        title="Strikethrough"
        onMouseDown={handleButtonMouseDown}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <path d="M16 6C16 6 14.5 4 12 4C9.5 4 8 6 8 8C8 10 10 12 16 12C22 12 22 12 22 12C22 12 22 16 16 16C10 16 10 16 10 16"></path>
          <path d="M8 16C8 16 10 18 12 18C14 18 16 16 16 14"></path>
        </svg>
      </button>
      
      {/* Font size dropdown */}
      <FontSizeDropdown editor={editor} />
      
      <span className="w-px h-6 mx-1 bg-border self-center"></span>

      {/* Add Link button */}
      <button
        type="button"
        onClick={() => setLinkDialogOpen(true)}
        className={`p-1.5 ${editor.isActive('link') ? 'bg-accent' : 'hover:bg-accent/50'}`}
        title="Insert Link"
        onMouseDown={handleButtonMouseDown}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
      </button>
      
      {editor.isActive('link') && (
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          className="p-1.5 hover:bg-accent/50"
          title="Remove Link"
          onMouseDown={handleButtonMouseDown}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
            <line x1="12" y1="2" x2="12" y2="12"></line>
          </svg>
        </button>
      )}
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 ${editor.isActive('bulletList') ? 'bg-accent' : 'hover:bg-accent/50'}`}
        title="Bullet List"
        onMouseDown={handleButtonMouseDown}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="9" y1="6" x2="20" y2="6"></line>
          <line x1="9" y1="12" x2="20" y2="12"></line>
          <line x1="9" y1="18" x2="20" y2="18"></line>
          <circle cx="4" cy="6" r="2"></circle>
          <circle cx="4" cy="12" r="2"></circle>
          <circle cx="4" cy="18" r="2"></circle>
        </svg>
      </button>
      
      <span className="w-px h-6 mx-1 bg-border self-center"></span>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 ${editor.isActive('orderedList') ? 'bg-accent' : 'hover:bg-accent/50'}`}
        title="Ordered List"
        onMouseDown={handleButtonMouseDown}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="6" x2="21" y2="6"></line>
          <line x1="10" y1="12" x2="21" y2="12"></line>
          <line x1="10" y1="18" x2="21" y2="18"></line>
          <path d="M4 6h1v4"></path>
          <path d="M4 10h2"></path>
          <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
        </svg>
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 ${editor.isActive('blockquote') ? 'bg-accent' : 'hover:bg-accent/50'}`}
        title="Blockquote"
        onMouseDown={handleButtonMouseDown}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
        </svg>
      </button>

      <span className="w-px h-6 mx-1 bg-border self-center"></span>

      {/* Replace the four alignment buttons with our new dropdown */}
      <AlignmentDropdown editor={editor} />

      <span className="w-px h-6 mx-1 bg-border self-center"></span>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 ${editor.isActive('codeBlock') ? 'bg-accent' : 'hover:bg-accent/50'}`}
        title="Code Block"
        onMouseDown={handleButtonMouseDown}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      </button>

      <button
        type="button"
        disabled={uploading}
        onClick={onImageUpload}
        className={`p-1.5 ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/50'}`}
        title="Insert Image"
        onMouseDown={handleButtonMouseDown}
      >
        {uploading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 hover:bg-accent/50 disabled:opacity-50"
        title="Undo"
        onMouseDown={handleButtonMouseDown}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6"></path>
          <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path>
        </svg>
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 hover:bg-accent/50 disabled:opacity-50"
        title="Redo"
        onMouseDown={handleButtonMouseDown}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6"></path>
          <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path>
        </svg>
      </button>

      {/* Link dialog for inserting/editing links */}
      <LinkDialog
        editor={editor}
        isOpen={linkDialogOpen}
        setIsOpen={setLinkDialogOpen}
      />
    </div>
  )
}

const TipTapEditor = ({ content, onChange, placeholder = "Write your content here..." }) => {
  const [uploading, setUploading] = useState(false)
  const [initialContent, setInitialContent] = useState(content || '')
  const { toast } = useToast()
  const editorRef = useRef(null)
  
  // Update initialContent when content prop changes, but only if it's different
  useEffect(() => {
    if (content && content !== initialContent) {
      setInitialContent(content);
    }
  }, [content]);
  
  // Update editor props to better handle overflow
  const editor = useEditor({
    extensions: [
      // Configure StarterKit to disable built-in Strike extension
      StarterKit.configure({
        // Disable the built-in strike extension because we're adding it separately
        strike: false
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image',
          style: 'max-width: 100%; max-height: 400px; object-fit: contain;'
        },
      }),
      Link.configure({
        openOnClick: false, // Keep this to prevent opening on click in the editor
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4',
          target: '_blank', // Restore opening links in new tab
          rel: 'noopener noreferrer', // Security best practice for links
        },
        validate: href => /^https?:\/\//.test(href), // Only allow http/https links
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextStyle,
      Color,
      FontSize,
      Underline,
      Strike, // We explicitly add Strike extension here
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert min-h-[250px] max-h-[500px] max-w-none p-4 focus:outline-none overflow-y-auto font-mono',
      },
      handleDOMEvents: {
        // Prevent editor from capturing scroll events from the document
        scroll: () => false
      }
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onFocus: () => {
      // Store reference that editor is focused
      if (editorRef.current) {
        editorRef.current.focused = true
      }
    },
    onBlur: () => {
      // Store reference that editor lost focus
      if (editorRef.current) {
        editorRef.current.focused = false
      }
    }
  }, []) // Remove initialContent dependency to prevent re-initialization

  // Store editor reference
  useEffect(() => {
    if (editor) {
      editorRef.current = editor
    }
  }, [editor])

  // Handle content updates separately without recreating the editor
  useEffect(() => {
    if (editor && initialContent && !editor.isDestroyed) {
      // Only update content if editor is initialized and content is different
      const currentContent = editor.getHTML()
      if (initialContent !== currentContent && currentContent === '<p></p>') {
        editor.commands.setContent(initialContent)
      }
    }
  }, [editor, initialContent])

  // Add click handler to restore focus if input stops working
  const handleContainerClick = useCallback(() => {
    if (editor && !editor.isDestroyed && editorRef.current && !editorRef.current.focused) {
      editor.commands.focus('end')
    }
  }, [editor])

  // Add keyboard event listener to detect if editor should have focus but doesn't
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only try to focus the editor if no other input elements are focused
      // This prevents stealing focus from other inputs like the title field
      if (editor && !editor.isDestroyed && editorRef.current && 
          !editorRef.current.focused && 
          (!document.activeElement || document.activeElement === document.body)) {
        // Focus the editor only if no other input has focus
        editor.commands.focus('end')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor])

  // Enhanced image upload handler with better size constraints
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()
    
    input.onchange = async () => {
      if (!input.files?.length) return
      const file = input.files[0]
      
      try {
        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await apiPost('/api/uploads', formData, {
          headers: {
            // Don't set Content-Type here as it will be set automatically with FormData
            // including the correct boundary string
          },
          // Don't JSON-stringify the body for FormData
          rawBody: formData
        })
        
        if (!response.ok) {
          throw new Error('Upload failed')
        }
        
        const data = await response.json()
        
        // Handle both absolute and relative URLs from backend
        const imageUrl = data.url;
        
        // Insert image with appropriate styling
        if (editor) {
          editor.chain().focus().setImage({ 
            src: imageUrl,
            alt: file.name,
            title: file.name,
          }).run()
        }
        
        toast({
          title: "Image Uploaded",
          description: "Image has been successfully uploaded and inserted.",
        })
      } catch (error) {
        console.error('Upload error:', error)
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Failed to upload image. Please try again.",
        })
      } finally {
        setUploading(false)
      }
    }
  }, [editor, toast])

  return (
    <div 
      className="editor-container border border-input w-full min-h-[300px] relative"
      onClick={handleContainerClick}
    >
      <EditorMenuBar 
        editor={editor} 
        onImageUpload={handleImageUpload} 
        uploading={uploading} 
      />
      <EditorContent editor={editor} className="min-h-[250px] relative" />
    </div>
  )
}

export default TipTapEditor
