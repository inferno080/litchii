import { Moon, Sun } from 'lucide-react'
import { Button } from '@chakra-ui/react'
import { useColorMode } from './color-mode'

export function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode()

  return <Button
    aria-label="Toggle theme"
    title="Toggle theme"
    variant="outline"
    size="sm"
    onClick={toggleColorMode}
  >
    {colorMode === 'light' ? <Sun size={18} /> : <Moon size={18} />}
  </Button>
}