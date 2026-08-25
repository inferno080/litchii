import { useEffect, useMemo, useState } from 'react'
import { Box, Button, HStack, SimpleGrid, Spinner, Stack, Text } from '@chakra-ui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { toaster } from '../../components/ui/toaster'
import { apiUrl, supabase } from '../../lib/supabase'

type PostSummary = { date: string; icon: string | null }

const formatDate = (date: Date) => date.toISOString().slice(0, 10)

export function PublicJournalPage() {
  const navigate = useNavigate()
  const { username = '' } = useParams()
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState('')
  const [viewDate, setViewDate] = useState(() => new Date())
  const monthStart = useMemo(() => new Date(viewDate.getFullYear(), viewDate.getMonth(), 1), [viewDate])
  const monthEnd = useMemo(() => new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0), [monthStart])
  const daysInMonth = monthEnd.getDate()
  const firstDay = monthStart.getDay()

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => setIsLoggedIn(Boolean(data.session)))
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => setIsLoggedIn(Boolean(session)))
    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true)
      setError('')
      try {
        const response = await fetch(`${apiUrl}/${encodeURIComponent(username)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate: formatDate(monthStart), endDate: formatDate(monthEnd) }),
        })
        if (!response.ok) throw new Error(response.status === 404 ? 'Journal not found.' : 'Unable to load this journal.')
        setPosts((await response.json()) as PostSummary[])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load this journal.')
      } finally {
        setIsLoading(false)
      }
    }
    void loadPosts()
  }, [monthEnd, monthStart, username])

  const postsByDate = new Map(posts.map((post) => [post.date.slice(0, 10), post]))

  const changeMonth = (offset: number) => {
    setViewDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1))
  }

  const handleSignOut = async () => {
    if (!supabase) return
    setIsSigningOut(true)
    const { error: signOutError } = await supabase.auth.signOut()
    setIsSigningOut(false)
    if (signOutError) {
      toaster.create({ description: signOutError.message, type: 'error' })
      return
    }
    toaster.create({ description: 'Signed out successfully.', type: 'success' })
  }

  return <Box minH="100vh" bg="bg.subtle" px={{ base: '4', md: '8' }} py={{ base: '4', md: '8' }}>
    <Stack w="full" gap="8">
      <HStack justify="space-between" align="flex-start" borderBottomWidth="1px" borderColor="gray.200" pb="4">
        <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="700">{username}'s space</Text>
        {isLoggedIn ? <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isSigningOut}>{isSigningOut ? 'Signing out...' : 'Sign out'}</Button> : <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>Sign in</Button>}
      </HStack>
      <Stack gap="5" h="full" minH={{ base: 'calc(100vh - 12rem)', md: 'calc(100vh - 13rem)' }}>
          <HStack justify="space-between" align="center">
            <Button aria-label="Previous month" variant="outline" size="sm" borderRadius="full" onClick={() => changeMonth(-1)}>&larr;</Button>
            <Text as="h3" textAlign="center" fontSize={{ base: 'xl', md: '2xl' }} fontWeight="700">{monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
            <Button aria-label="Next month" variant="outline" size="sm" borderRadius="full" onClick={() => changeMonth(1)}>&rarr;</Button>
          </HStack>
          {isLoading ? <Spinner mx="auto" /> : error ? <Text textAlign="center" color="fg.muted">{error}</Text> : <>
            <SimpleGrid columns={7} gap="2" color="fg.muted" fontSize="xs" textAlign="center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <Text key={day}>{day}</Text>)}
            </SimpleGrid>
            <SimpleGrid columns={7} gap="2" flex="1" gridAutoRows="minmax(5rem, 1fr)" minH={{ base: '28rem', md: 'calc(100vh - 19rem)' }}>
              {Array.from({ length: firstDay }, (_, index) => <Box key={`empty-${index}`} minH={{ base: '16', md: '24' }} />)}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const dateKey = formatDate(new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 1))
                const post = postsByDate.get(dateKey)
                return <Button key={dateKey} variant="outline" position="relative" justifyContent="flex-start" alignItems="flex-start" minH={{ base: '16', md: '24' }} p="3" fontSize="xs">
                  <Text>{index + 1}</Text>
                  <Text position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" fontSize="lg">{post?.icon ?? '-'}</Text>
                </Button>
              })}
            </SimpleGrid>
          </>}
      </Stack>
    </Stack>
  </Box>
}