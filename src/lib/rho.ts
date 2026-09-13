// Rho integration boundary. Everything the app needs from Rho goes
// through this interface so the mock can be swapped for the real client
// without touching callers.

export type ReimbursementRequest = {
  workspaceId: string
  founderName: string
  amount: number
  memo: string
  attachments: string[]   // receipt URLs, as supporting documents
}

export type ReimbursementResult = {
  ref: string             // transfer reference
  status: 'initiated'
  initiatedAt: string
}

export type IncorporationResult = {
  entityId: string
  accountId: string
  completedAt: string
}

export interface RhoClient {
  incorporate(input: { name: string; purpose: string; founders: string[] }): Promise<IncorporationResult>
  initiateReimbursement(req: ReimbursementRequest): Promise<ReimbursementResult>
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const id = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`

// Simulates the real flow's timing and shape. Nothing leaves the browser.
export const mockRho: RhoClient = {
  async incorporate() {
    await wait(1400)
    return { entityId: id('ent'), accountId: id('acct'), completedAt: new Date().toISOString() }
  },
  async initiateReimbursement() {
    await wait(1100)
    return { ref: id('trf'), status: 'initiated', initiatedAt: new Date().toISOString() }
  },
}

export const rho: RhoClient = mockRho
