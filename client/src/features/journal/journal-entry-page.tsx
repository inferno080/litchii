import { useEffect, useRef, useState } from 'react'
import type { OutputData } from '@editorjs/editorjs'
import EditorJS from '@editorjs/editorjs'
import CodeCup from '@calumk/editorjs-codecup'
import Checklist from '@editorjs/checklist'
import Delimiter from '@editorjs/delimiter'
import Header from '@editorjs/header'
import ImageTool from '@editorjs/image'
import InlineCode from '@editorjs/inline-code'
import LinkTool from '@editorjs/link'
import List from '@editorjs/list'
import Marker from '@editorjs/marker'
import Quote from '@editorjs/quote'
import Table from '@editorjs/table'
import Underline from '@editorjs/underline'
import { EmojiPicker } from 'frimousse'
import { Box, Button, HStack, Input, Spinner, Stack, Text } from '@chakra-ui/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ThemeToggle } from '../../components/ui/theme-toggle'
import { toaster } from '../../components/ui/toaster'
import { apiUrl, supabase } from '../../lib/supabase'

type JournalEntry = { content: OutputData; icon: string | null; title: string | null; author: { username: string } }

const emptyDocument: OutputData = { time: Date.now(), blocks: [], version: '2.30.0' }

export function JournalEntryPage() {
  const navigate = useNavigate()
  const { username = '', date = '' } = useParams()
  const defaultTitle = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { dateStyle: 'full' })
  const editorHolder = useRef<HTMLDivElement>(null)
  const editor = useRef<EditorJS | null>(null)
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [document, setDocument] = useState<OutputData>(emptyDocument)
  const [icon, setIcon] = useState('')
  const [title, setTitle] = useState(defaultTitle)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadEntry = async () => {
      try {
        const entryResponse = await fetch(`${apiUrl}/${encodeURIComponent(username)}/${date}`)
        if (entryResponse.ok) {
          const loadedEntry = (await entryResponse.json()) as JournalEntry
          setEntry(loadedEntry)
          setDocument(loadedEntry.content)
          setIcon(loadedEntry.icon ?? '')
          setTitle(loadedEntry.title ?? defaultTitle)
        } else if (entryResponse.status !== 404) {
          throw new Error('Unable to load this journal entry.')
        }
        if (supabase) {
          const { data } = await supabase.auth.getSession()
          if (data.session) {
            const profileResponse = await fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${data.session.access_token}` } })
            if (profileResponse.ok) {
              const profile = (await profileResponse.json()) as { profile: { username: string } | null }
              setCanEdit(profile.profile?.username === username)
            }
          }
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load this journal entry.')
      } finally {
        setIsLoading(false)
      }
    }
    void loadEntry()
  }, [date, defaultTitle, username])

  useEffect(() => {
    if (isLoading || error || !editorHolder.current) return
    editor.current = new EditorJS({
      holder: editorHolder.current,
      readOnly: !canEdit,
      data: document,
      autofocus: canEdit,
      placeholder: canEdit ? 'Start writing...' : undefined,
      inlineToolbar: canEdit,
      tools: {
        header: { class: Header, config: { levels: [1, 2, 3, 4], defaultLevel: 2 } },
        list: List,
        code: CodeCup,
        checklist: Checklist,
        delimiter: Delimiter,
        quote: Quote,
        table: Table,
        marker: Marker,
        inlineCode: InlineCode,
        underline: Underline,
        linkTool: LinkTool,
        image: {
          class: ImageTool,
          config: {
            features: { caption: false },
            uploader: {
              uploadByUrl: async (url: string) => ({ success: 1, file: { url } }),
              uploadByFile: async (file: File) => {
                if (!supabase) return { success: 0 }
                const { data } = await supabase.auth.getSession()
                if (!data.session) return { success: 0 }
                const formData = new FormData()
                formData.append('image', file)
                const response = await fetch(`${apiUrl}/${encodeURIComponent(username)}/${date}/image`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${data.session.access_token}` },
                  body: formData,
                })
                if (!response.ok) return { success: 0 }
                return (await response.json()) as { success: 1; file: { url: string } }
              },
            },
          },
        },
      },
    })
    return () => {
      const currentEditor = editor.current
      editor.current = null
      if (currentEditor) void currentEditor.isReady.then(() => currentEditor.destroy())
    }
  }, [canEdit, date, document, error, isLoading, username])

  const saveEntry = async () => {
    if (!editor.current || !supabase) return
    const { data } = await supabase.auth.getSession()
    if (!data.session) return
    setIsSaving(true)
    try {
      const content = await editor.current.save()
      const response = await fetch(`${apiUrl}/${encodeURIComponent(username)}/${date}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, icon: icon || null, title: title.trim() || defaultTitle }),
      })
      if (!response.ok) throw new Error('Unable to save this journal entry.')
      setEntry((currentEntry) => ({ ...(currentEntry ?? { author: { username } }), content, icon: icon || null, title: title.trim() || defaultTitle }))
      toaster.create({ description: 'Journal entry saved.', type: 'success' })
    } catch (saveError) {
      toaster.create({ description: saveError instanceof Error ? saveError.message : 'Unable to save this journal entry.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <Spinner position="fixed" top="50%" left="50%" />
  if (error) return <Text p="8">{error}</Text>

  return <Box minH="100vh" bg="bg.subtle" px={{ base: '4', md: '8' }} py={{ base: '4', md: '8' }}>
    <Stack w="full" gap="6" minH={{ base: 'calc(100vh - 4rem)', md: 'calc(100vh - 4rem)' }}>
      <HStack justify="space-between" borderBottomWidth="0.5px" borderColor="gray.100" pb="2">
        <Button variant="ghost" onClick={() => navigate(`/${username}`)}>&larr; Calendar</Button>
        <HStack gap="2">
          <ThemeToggle />
          {canEdit && <Button size="sm" onClick={saveEntry} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>}
        </HStack>
      </HStack>
      <HStack gap="3" align="center">
        {canEdit ? <Box position="relative">
          <Button aria-label="Choose an emoji for this entry" className="journal-emoji-selector" fontSize="4xl" variant={icon ? 'ghost' : 'outline'} onClick={() => setIsEmojiPickerOpen((open) => !open)}>{icon || '+'}</Button>
          {isEmojiPickerOpen && <Box className="journal-emoji-picker">
            <EmojiPicker.Root onEmojiSelect={({ emoji }) => { setIcon(emoji); setIsEmojiPickerOpen(false) }}>
              <EmojiPicker.Search />
              <EmojiPicker.Viewport>
                <EmojiPicker.Loading>Loading...</EmojiPicker.Loading>
                <EmojiPicker.Empty>No emoji found.</EmojiPicker.Empty>
                <EmojiPicker.List />
              </EmojiPicker.Viewport>
            </EmojiPicker.Root>
          </Box>}
        </Box> : entry?.icon && <Text fontSize="4xl" aria-label={`Entry emoji: ${entry.icon}`}>{entry.icon}</Text>}
        {canEdit ? <Input variant="flushed" value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Entry title" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="700" /> : <Text as="h1" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="700">{entry?.title || defaultTitle}</Text>}
      </HStack>
      <Box ref={editorHolder} className="journal-editor" flex="1" />
      {!canEdit && !entry && <Text color="fg.muted">This entry has not been written yet.</Text>}
      {!canEdit && <Text color="fg.muted" fontSize="sm"> <Link to="/auth">Sign in</Link> to write your own entries.</Text>}
    </Stack>
  </Box>
}