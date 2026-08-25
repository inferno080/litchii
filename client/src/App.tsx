import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthPage } from './features/auth/auth-page'
import { PublicJournalPage } from './features/journal/public-journal-page'
import { JournalEntryPage } from './features/journal/journal-entry-page'

function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/:username/:date" element={<JournalEntryPage />} />
      <Route path="/:username" element={<PublicJournalPage />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  </BrowserRouter>
}

export default App
