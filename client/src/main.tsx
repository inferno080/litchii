import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { ColorModeProvider } from './components/ui/color-mode.tsx'
import { AppToaster } from './components/ui/toaster.tsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorModeProvider>
      <ChakraProvider value={defaultSystem}>
        <QueryClientProvider client={queryClient}>
          <App />
          <AppToaster />
        </QueryClientProvider>
      </ChakraProvider>
    </ColorModeProvider>
  </StrictMode>,
)
