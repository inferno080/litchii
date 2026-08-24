import { Box, Heading, Stack, Text } from '@chakra-ui/react'

function App() {
  return (
    <Box minH="100vh" bg="gray.50" px="6" py="20">
      <Stack maxW="3xl" mx="auto" gap="4">
        <Text color="blue.600" fontWeight="semibold" textTransform="uppercase">
          Litchii
        </Text>
        <Heading size="4xl">Blogging platform setup complete.</Heading>
        <Text color="gray.600" fontSize="lg">
          React, Vite, TypeScript, Chakra UI, and React Query are ready for the frontend.
        </Text>
      </Stack>
    </Box>
  )
}

export default App
