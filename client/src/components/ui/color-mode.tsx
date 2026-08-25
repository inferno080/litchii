import type { PropsWithChildren } from 'react'
import { ThemeProvider, useTheme } from 'next-themes'

export function ColorModeProvider({ children }: PropsWithChildren) {
  return <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>{children}</ThemeProvider>
}

export function useColorMode() {
  const { resolvedTheme, setTheme } = useTheme()
  const colorMode: 'dark' | 'light' = resolvedTheme === 'dark' ? 'dark' : 'light'
  return { colorMode, toggleColorMode: () => setTheme(colorMode === 'dark' ? 'light' : 'dark') }
}
