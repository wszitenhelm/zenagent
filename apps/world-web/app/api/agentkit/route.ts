import { NextResponse } from 'next/server'

/**
 * AgentKit demonstration endpoint
 * 
 * This endpoint demonstrates World ID AgentKit integration with human-backed agents.
 * 
 * Mode: free-trial
 * - 3 uses for unverified users
 * - Unlimited for verified users
 * 
 * Uses createAgentkitHooks pattern from @worldcoin/agentkit
 */

// Mock AgentKit hooks implementation for demonstration
// In production, this would import from @worldcoin/agentkit
const createAgentkitHooks = (config: { 
  app_id: string
  mode: 'free-trial'
  action: string
}) => {
  return {
    useVerification: () => ({
      isVerified: false,
      nullifierHash: null,
    }),
    useFreeTrial: () => ({
      usesRemaining: 3,
      isActive: true,
    }),
    useAgent: () => ({
      invoke: async (prompt: string) => {
        return {
          response: `AgentKit demo response for: ${prompt}`,
          timestamp: Date.now(),
        }
      },
    }),
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      prompt?: string
      userVerified?: boolean
      nullifierHash?: string
    }

    const { prompt, userVerified, nullifierHash } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      )
    }

    // AgentKit configuration
    const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID
    if (!appId) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_WORLD_APP_ID' },
        { status: 500 }
      )
    }

    // Create AgentKit hooks instance
    const hooks = createAgentkitHooks({
      app_id: appId,
      mode: 'free-trial',
      action: 'zenagent-checkin',
    })

    // Check verification status
    const verification = hooks.useVerification()
    const freeTrial = hooks.useFreeTrial()
    const agent = hooks.useAgent()

    // Determine access level
    let accessLevel: 'unlimited' | 'limited' | 'none'
    let usesRemaining: number

    if (userVerified || verification.isVerified) {
      accessLevel = 'unlimited'
      usesRemaining = -1 // unlimited
    } else if (freeTrial.isActive && freeTrial.usesRemaining > 0) {
      accessLevel = 'limited'
      usesRemaining = freeTrial.usesRemaining
    } else {
      accessLevel = 'none'
      usesRemaining = 0
    }

    // If no access, return error with verification prompt
    if (accessLevel === 'none') {
      return NextResponse.json({
        success: false,
        error: 'Free trial exhausted. Verify with World ID for unlimited access.',
        requiresVerification: true,
        freeTrial: {
          usesRemaining: 0,
          isActive: false,
        },
      }, { status: 403 })
    }

    // Invoke the agent (demo response)
    const agentResponse = await agent.invoke(prompt)

    return NextResponse.json({
      success: true,
      response: agentResponse.response,
      timestamp: agentResponse.timestamp,
      accessLevel,
      usesRemaining,
      agentkit: {
        appId,
        mode: 'free-trial',
        verificationStatus: userVerified ? 'verified' : 'unverified',
        nullifierHash: nullifierHash || verification.nullifierHash,
      },
      // Demonstrates AgentKit human-backed agent concept
      proof: {
        type: 'human-backed-agent',
        description: 'This agent is backed by World ID human verification',
        verified: userVerified || verification.isVerified,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(): Promise<Response> {
  // Return AgentKit integration info
  return NextResponse.json({
    success: true,
    integration: 'World ID AgentKit',
    features: [
      'Human-backed agents',
      'Free trial mode (3 uses)',
      'Unlimited for verified users',
      'createAgentkitHooks pattern',
    ],
    mode: 'free-trial',
    documentation: 'https://docs.world.org/agents/agent-kit/integrate',
  })
}
