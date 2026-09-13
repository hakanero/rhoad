import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter, Navigate, Route, Routes, useLocation,
} from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Login from './routes/Login'
import NewWorkspace from './routes/NewWorkspace'
import Join from './routes/Join'
import WorkspaceLayout from './routes/WorkspaceLayout'
import Home from './routes/Home'
import Pitch from './routes/Pitch'
import Content from './routes/Content'
import NextSteps from './routes/NextSteps'
import Incorporate from './routes/Incorporate'
import './index.css'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <p className="p-8 text-sm text-muted">…</p>
  if (!session) {
    // Carry the destination through sign-in so invite links survive it.
    return <Navigate replace to={`/login?next=${encodeURIComponent(loc.pathname)}`} />
  }
  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/new" element={<RequireAuth><NewWorkspace /></RequireAuth>} />
          <Route path="/join/:slug" element={<RequireAuth><Join /></RequireAuth>} />
          <Route path="/w/:slug" element={<RequireAuth><WorkspaceLayout /></RequireAuth>}>
            <Route index element={<Home />} />
            <Route path="pitch" element={<Pitch />} />
            <Route path="content" element={<Content />} />
            <Route path="next" element={<NextSteps />} />
            <Route path="incorporate" element={<Incorporate />} />
          </Route>
          <Route path="*" element={<Navigate replace to="/new" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
