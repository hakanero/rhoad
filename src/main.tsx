import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter, Navigate, Route, Routes, useLocation,
} from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Landing from './routes/Landing'
import Login from './routes/Login'
import NewWorkspace from './routes/NewWorkspace'
import Workspaces from './routes/Workspaces'
import Join from './routes/Join'
import WorkspaceLayout from './routes/WorkspaceLayout'
import Home from './routes/Home'
import Pitch from './routes/Pitch'
import FinancesLayout from './routes/finances/Layout'
import Ledger from './routes/finances/Ledger'
import Founders from './routes/finances/Founders'
import Statement from './routes/finances/Statement'
import Projection from './routes/finances/Projection'
import Income from './routes/finances/Income'
import Budget from './routes/finances/Budget'
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
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/workspaces" element={<RequireAuth><Workspaces /></RequireAuth>} />
          <Route path="/new" element={<RequireAuth><NewWorkspace /></RequireAuth>} />
          <Route path="/join/:slug" element={<RequireAuth><Join /></RequireAuth>} />
          <Route path="/w/:slug" element={<RequireAuth><WorkspaceLayout /></RequireAuth>}>
            <Route index element={<Home />} />
            <Route path="finances" element={<FinancesLayout />}>
              <Route index element={<Ledger />} />
              <Route path="income" element={<Income />} />
              <Route path="budget" element={<Budget />} />
              <Route path="founders" element={<Founders />} />
              <Route path="founders/:memberId" element={<Statement />} />
              <Route path="projection" element={<Projection />} />
            </Route>
            <Route path="pitch" element={<Pitch />} />
            <Route path="content" element={<Content />} />
            <Route path="next" element={<NextSteps />} />
          </Route>
          <Route path="/w/:slug/incorporate" element={<RequireAuth><Incorporate /></RequireAuth>} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
