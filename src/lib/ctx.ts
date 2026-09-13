import { useOutletContext } from 'react-router-dom'
import type { WorkspaceData } from './useWorkspace'
import type { Member } from './types'

export type Ctx = WorkspaceData & { me: Member | null }
export const useWs = () => useOutletContext<Ctx>()
