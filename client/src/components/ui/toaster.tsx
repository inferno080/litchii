import { createToaster, Toaster, Toast } from '@chakra-ui/react'

export const toaster = createToaster({
  placement: 'bottom',
  pauseOnPageIdle: true,
})

export function AppToaster() {
  return (
    <Toaster toaster={toaster}>
      {(toast) => (
        <Toast.Root
          key={toast.id}
          bg={{ base: 'gray.800', _dark: 'gray.100' }}
          color={{ base: 'white', _dark: 'gray.900' }}
          borderRadius="md"
          boxShadow="lg"
          w={{ base: 'calc(100vw - 2rem)', md: 'lg' }}
          maxW="calc(100vw - 2rem)"
          minH="12"
          px="3"
          py="2"
          display="flex"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          position="relative"
        >
          <Toast.Title fontSize="md" fontWeight="medium">
            {toast.description ?? toast.title}
          </Toast.Title>
          <Toast.CloseTrigger
            position="absolute"
            right="2"
            top="50%"
            transform="translateY(-50%)"
            color="gray.300"
            _hover={{ color: 'white' }}
            _dark={{ color: 'gray.600', _hover: { color: 'gray.900' } }}
          />
        </Toast.Root>
      )}
    </Toaster>
  )
}
