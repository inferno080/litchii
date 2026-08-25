import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Box, Button, Field, HStack, Image, Input, Stack, Text, Theme } from '@chakra-ui/react'
import { useColorMode } from '../../components/ui/color-mode'
import { toaster } from '../../components/ui/toaster'
import { supabase } from '../../lib/supabase'
import { createProfile } from './profile-api'

type AuthMode = 'sign-in' | 'sign-up'

export function AuthPage() {
  const { colorMode, toggleColorMode } = useColorMode()
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSignUp = mode === 'sign-up'
  const notify = (description: string, type: 'error' | 'success' = 'success') => toaster.create({ description, type })

  useEffect(() => {
    const client = supabase
    if (!client) return
    const completePendingProfile = async () => {
      const { data } = await client.auth.getSession()
      if (!data.session) return
      const emailKey = data.session.user.email ? `litchii:pending-username:${data.session.user.email.toLowerCase()}` : null
      const pendingUsername = (emailKey ? localStorage.getItem(emailKey) : null) ?? localStorage.getItem('litchii:pending-google-username')
      if (!pendingUsername) return
      await createProfile(data.session.access_token, pendingUsername)
      if (emailKey) localStorage.removeItem(emailKey)
      localStorage.removeItem('litchii:pending-google-username')
      notify('Your profile is ready.')
    }
    void completePendingProfile().catch((error: unknown) => notify(error instanceof Error ? error.message : 'Unable to create your profile.', 'error'))
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) { notify('Add the Supabase environment variables before using authentication.', 'error'); return }
    if (isSignUp && password !== confirmPassword) { notify('Passwords do not match.', 'error'); return }
    setIsSubmitting(true)
    try {
      if (isSignUp) {
        const normalizedUsername = username.trim().toLowerCase()
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username: normalizedUsername } } })
        if (error) throw error
        if (data.user?.identities?.length === 0) {
          setMode('sign-in')
          notify('An account already exists for this email.', 'error')
          return
        }
        localStorage.setItem(`litchii:pending-username:${email.toLowerCase()}`, normalizedUsername)
        if (data.session) { await createProfile(data.session.access_token, normalizedUsername); localStorage.removeItem(`litchii:pending-username:${email.toLowerCase()}`); notify('Account created. Your profile is ready.') }
        else { setMode('sign-in'); notify('Check your email to confirm your account, then sign in.') }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const pendingUsername = localStorage.getItem(`litchii:pending-username:${email.toLowerCase()}`)
        if (pendingUsername) { await createProfile(data.session.access_token, pendingUsername); localStorage.removeItem(`litchii:pending-username:${email.toLowerCase()}`) }
        notify('Signed in successfully.')
      }
    } catch (error) { notify(error instanceof Error ? error.message : 'Something went wrong. Please try again.', 'error') } finally { setIsSubmitting(false) }
  }

  const handleGoogleAuth = async () => {
    if (!supabase) { notify('Add the Supabase environment variables before using authentication.', 'error'); return }
    if (isSignUp) { const value = username.trim().toLowerCase(); if (!value) { notify('Choose a username before continuing with Google.', 'error'); return }; localStorage.setItem('litchii:pending-google-username', value) }
    setIsSubmitting(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (error) { notify(error.message, 'error'); setIsSubmitting(false) }
  }

  const switchMode = (nextMode: AuthMode) => setMode(nextMode)
  const field = (label: string, child: ReactNode) => <Field.Root required><Field.Label>{label}</Field.Label>{child}</Field.Root>

  return <Theme appearance={colorMode}><Box minH="100vh" bg="bg.subtle" color="fg" px={{ base: '5', md: '8' }} py="20">
    <Button position="fixed" top={{ base: '3', md: '5' }} right={{ base: '3', md: '5' }} variant="outline" colorPalette="gray" size="sm" onClick={toggleColorMode}>{colorMode === 'dark' ? 'Light' : 'Dark'}</Button>
    <Stack as="main" maxW="lg" mx="auto" minH="calc(100vh - 10rem)" justify="center" gap="7">
      <Image src="/art/Litchi_Transparent_Big.PNG" alt="Litchi" w={{ base: '52', md: '64' }} mx="auto" />
      <HStack borderBottomWidth="1px" borderColor="border" gap="0"><Button flex="1" variant="plain" borderBottomWidth="2px" borderColor={!isSignUp ? 'fg' : 'transparent'} borderRadius="0" onClick={() => switchMode('sign-in')}>Sign in</Button><Button flex="1" variant="plain" borderBottomWidth="2px" borderColor={isSignUp ? 'fg' : 'transparent'} borderRadius="0" onClick={() => switchMode('sign-up')}>Sign up</Button></HStack>
      <form onSubmit={handleSubmit}><Stack gap="5">
        {isSignUp && field('Username', <Input size="lg" minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]+" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="your_username" />)}
        {field('Email', <Input size="lg" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" />)}
        {field('Password', <Input size="lg" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder="••••••••" />)}
        {isSignUp && field('Confirm password', <Input size="lg" type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="••••••••" />)}
        <Button type="submit" size="lg" bg={{ base: 'gray.800', _dark: 'gray.100' }} color={{ base: 'white', _dark: 'gray.900' }} _hover={{ bg: { base: 'gray.700', _dark: 'white' } }} disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}</Button>
      </Stack></form>
      <HStack gap="3" color="fg.muted"><Box flex="1" h="1px" bg="border" /><Text fontSize="sm">or</Text><Box flex="1" h="1px" bg="border" /></HStack>
      <Button variant="outline" size="lg" colorPalette="gray" onClick={handleGoogleAuth} disabled={isSubmitting}>Continue with Google</Button>
    </Stack>
  </Box></Theme>
}
