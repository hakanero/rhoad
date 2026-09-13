// Rho integration boundary. rhoad ends at the handoff: it prepares the
// incorporation and hands the workspace's data to Rho. Everything after
// formation (EIN, banking, reimbursement) is Rho's product, not this one.

export type IncorporationInput = {
  name: string
  purpose: string
  state: string
  entityType: string
  founders: { name: string; equity: number | null }[]
  founderAdvances: { name: string; amount: number }[]
}

export type IncorporationResult = {
  filingId: string
  submittedAt: string
}

export interface RhoClient {
  submitIncorporation(input: IncorporationInput): Promise<IncorporationResult>
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Simulates the real flow's timing and shape. Nothing leaves the browser.
export const mockRho: RhoClient = {
  async submitIncorporation() {
    await wait(1600)
    return {
      filingId: `DE-${Math.floor(1e6 + Math.random() * 9e6)}`,
      submittedAt: new Date().toISOString(),
    }
  },
}

export const rho: RhoClient = mockRho
