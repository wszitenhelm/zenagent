"use client";

import { useState } from 'react'
import { IDKit, orbLegacy } from '@worldcoin/idkit-core'
import type { IDKitResult } from '@worldcoin/idkit-core'
import { QRCodeSVG } from 'qrcode.react'

const ACTION = 'zenagent-checkin'

export default function Home() {
  const [walletAddress, setWalletAddress] = useState('')
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<string>('')
  const [lastTx, setLastTx] = useState<string>('')
  const [connectorURI, setConnectorURI] = useState<string>('')

  async function register() {
    try {
      setStatus('Registering user onchain...')
      setLastTx('')

      if (!walletAddress) throw new Error('Missing wallet address')
      if (!username) throw new Error('Missing username')

      const res = await fetch('/api/registry/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress, username }),
      }).then((r) => r.json())

      if (!res?.success) throw new Error(res?.error || 'Registration failed')
      setLastTx(res.txHash || '')
      setStatus('Registered ✅ Now run World ID verification.')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      setStatus(`Error: ${message}`)
    }
  }

  async function verify() {
    try {
      setStatus('Requesting RP signature...')
      setLastTx('')
      setConnectorURI('')

      const app_id = process.env.NEXT_PUBLIC_WORLD_APP_ID
      const rp_id = process.env.NEXT_PUBLIC_WORLD_RP_ID
      const environment = (process.env.NEXT_PUBLIC_WORLD_ENVIRONMENT || 'staging') as 'staging' | 'production'

      if (!app_id) throw new Error('Missing NEXT_PUBLIC_WORLD_APP_ID')
      if (!rp_id) throw new Error('Missing NEXT_PUBLIC_WORLD_RP_ID')
      if (!walletAddress) throw new Error('Missing wallet address')

      const rpSig = await fetch('/api/rp-signature', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: ACTION }),
      }).then((r) => r.json())

      setStatus('Opening World ID...')
      const request = await IDKit.request({
        app_id: app_id as `app_${string}`,
        action: ACTION,
        rp_context: {
          rp_id,
          nonce: rpSig.nonce,
          created_at: rpSig.created_at,
          expires_at: rpSig.expires_at,
          signature: rpSig.sig,
        },
        allow_legacy_proofs: true,
        environment,
      }).preset(
        orbLegacy({
          signal: walletAddress,
        }),
      )

      setConnectorURI(request.connectorURI)
      setStatus('Open the World ID link (below) in World App / simulator, then come back here...')

      const completion = await request.pollUntilCompletion()
      const idkitResponse: IDKitResult = (completion as any)?.result ?? completion

      setStatus('Verifying proof + writing onchain...')
      const res = await fetch('/api/world/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ walletAddress, idkitResponse }),
      }).then((r) => r.json())

      if (!res?.success) throw new Error(res?.error || 'Verification failed')
      setLastTx(res.txHash || '')
      setStatus('Verified and stored onchain ✅')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      setStatus(`Error: ${message}`)
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>ZenAgent — World ID Verification</h1>
      <p style={{ marginTop: 0 }}>
        This verifies a World ID proof server-side, then stores the verified nullifier onchain in ZenAgentRegistry (Sepolia).
      </p>

      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>Wallet address (the user you are verifying)</label>
      <input
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
        placeholder="0x..."
        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
      />

      <label style={{ display: 'block', marginTop: 16, marginBottom: 8 }}>Username (required by contract before World ID verify)</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="wikusia"
        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
      />

      <button
        onClick={register}
        style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, border: '1px solid #111', cursor: 'pointer' }}
      >
        1) Register user
      </button>

      <button
        onClick={verify}
        style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, border: '1px solid #111', cursor: 'pointer' }}
      >
        2) Verify with World ID
      </button>

      {connectorURI ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>World ID link</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button
              onClick={() => window.open(connectorURI, '_blank', 'noopener,noreferrer')}
              style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #111', cursor: 'pointer' }}
            >
              Open
            </button>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(connectorURI)
              }}
              style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #111', cursor: 'pointer' }}
            >
              Copy
            </button>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f6f6f6', padding: 12, borderRadius: 10 }}>
            {connectorURI}
          </pre>

          <div style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', padding: 10, borderRadius: 12, border: '1px solid #ddd' }}>
              <QRCodeSVG value={connectorURI} size={180} />
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>If the app opens but nothing happens</div>
              <div style={{ marginBottom: 6 }}>
                Use the simulator to complete the session (recommended for staging):
              </div>
              <div style={{ marginBottom: 6 }}>
                1) Open https://simulator.worldcoin.org/
              </div>
              <div style={{ marginBottom: 6 }}>
                2) Paste the link above (or scan the QR) when prompted
              </div>
              <div>3) Complete the flow, then return here and wait for the tx hash</div>
            </div>
          </div>
        </div>
      ) : null}

      {status ? <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{status}</pre> : null}
      {lastTx ? (
        <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>txHash: {lastTx}</pre>
      ) : null}
    </main>
  )
}
