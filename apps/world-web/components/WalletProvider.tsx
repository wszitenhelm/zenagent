"use client"

import { WagmiProvider, createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Block MetaMask SDK analytics requests and suppress errors
if (typeof window !== 'undefined') {
  // Suppress unhandled promise rejections from MetaMask
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.toString?.() || ''
    if (reason.includes('metamask') || reason.includes('analytics') || reason.includes('Failed to fetch')) {
      event.preventDefault()
      event.stopPropagation()
    }
  })
  
  // Suppress error events
  window.addEventListener('error', (event) => {
    const msg = event.message || ''
    if (msg.includes('metamask') || msg.includes('analytics') || msg.includes('Failed to fetch')) {
      event.preventDefault()
    }
  })
  
  const originalFetch = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString()
    if (url.includes('metamask.io') || url.includes('analytics') || url.includes('segment')) {
      return new Response('{}', { status: 200 })
    }
    try {
      return await originalFetch(input, init)
    } catch (e) {
      // Silently handle MetaMask and network errors
      if (url.includes('metamask') || url.includes('infura') || url.includes('alchemy')) {
        return new Response('{}', { status: 200 })
      }
      throw e
    }
  }
  
  // Also suppress console errors - completely silence MetaMask errors
  const origError = console.error
  console.error = (...args: any[]) => {
    const msg = args[0]?.toString?.() || ''
    // Suppress all common MetaMask and wallet errors
    if (msg.includes('Failed to fetch')) return
    if (msg.includes('Analytics SDK')) return
    if (msg.includes('sdk-analytics')) return
    if (msg.includes('metamask')) return
    if (msg.includes('MetaMask')) return
    if (msg.includes('Sender')) return
    if (msg.includes('wallet')) return
    if (msg.includes('provider')) return
    if (args[0] instanceof Error && args[0].message?.includes('fetch')) return
    origError.apply(console, args)
  }
  
  // Suppress console.warn too
  const origWarn = console.warn
  console.warn = (...args: any[]) => {
    const msg = args[0]?.toString?.() || ''
    if (msg.includes('MetaMask') || msg.includes('metamask')) return
    origWarn.apply(console, args)
  }
}

const queryClient = new QueryClient()

const config = createConfig({
  chains: [sepolia],
  connectors: [injected(), metaMask(), coinbaseWallet({ appName: 'ZenAgent' })],
  transports: {
    [sepolia.id]: http(),
  },
})

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
