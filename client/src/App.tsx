import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthPage } from './features/auth/auth-page'
import { PublicJournalPage } from './features/journal/public-journal-page'

function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/:username" element={<PublicJournalPage />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  </BrowserRouter>
}

export default App
