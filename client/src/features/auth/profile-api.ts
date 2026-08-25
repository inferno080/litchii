import { apiUrl } from '../../lib/supabase'

export async function createProfile(accessToken: string, username: string) {
  const response = await fetch(`${apiUrl}/auth/profile`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
  if (!response.ok && response.status !== 409) {
    const error = (await response.json()) as { message?: string }
    throw new Error(error.message ?? 'Unable to create your profile.')
  }
}

export async function getCurrentProfile(accessToken: string) {
  const response = await fetch(`${apiUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error('Unable to load your profile.')
  return (await response.json()) as { profile: { username: string } | null }
}
