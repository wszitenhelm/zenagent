# ZenAgent 🧘‍♂️

A crypto-native wellness companion for ETHGlobal Cannes 2026.

Built with Next.js, World ID AgentKit, ENS, and 0G.

## Bounty Integrations

### 🏆 World AgentKit ($8K Track)
**Implementation:**
- World ID verification via `@worldcoin/idkit` v2 widget
- Backend verification at `/api/world/verify` storing nullifier on Sepolia
- Human verification badge in navbar
- Gated check-ins requiring World ID

**AgentKit Demo Route:**
- `/api/agentkit` demonstrates `createAgentkitHooks` from `@worldcoin/agentkit`
- Mode: free-trial (3 uses unverified, unlimited verified)

### 🏆 ENS AI Agents ($5K Track)
**Implementation:**
- `lib/ens.ts` with `mintSubname()`, `updateWellnessTextRecords()`, `checkAvailability()`
- 8 text records: wellness.streak, wellness.level, wellness.lastCheckin, wellness.avgMood, wellness.badges, wellness.totalCheckins, agent.name, agent.specialty, description
- Level progression: Seedling 🌱 → Growing 🌿 → Blooming 🌸 → Thriving 🌳 → Zen Master ☯️
- ENS subname minting on Sepolia testnet
- Profile hero card with all text records display

### 🏆 0G Wildcard ($3K Track)
**Implementation:**
- **0G Storage:** `/api/0g/upload-journal` - AES-256 encrypted journal storage
- **0G Compute:** `/api/0g/manifestation` - AI-generated manifestation quotes
- **0G Compute Init:** `/api/0g/compute/init` - Network broker setup
- Check-in flow: encrypt → upload to 0G → onchain logCheckIn → generate quote
- "Powered by 0G" badge on check-in page

## Features

### Core Wellness Flow
- **Onboarding:** 3-step flow (World ID → Username/ENS → Complete)
- **Check-in:** Mood, stress, sleep tracking with manifestation quotes
- **Breathing:** 4-4-4-4 box breathing with animated circle
- **Insights:** AI-suggested habits, weekly AI letter, mood/stress scatter plot

### ENS Identity
- Username.zenagent.eth subnames
- 8 wellness text records on Sepolia
- Profile display with share functionality

### World ID Integration
- Orb-level verification required for check-ins
- Onchain nullifier storage
- "Human Verified" green shield badge

## Architecture

```
├── apps/world-web/           # Next.js 16 application
│   ├── app/api/             # API routes
│   │   ├── world/verify     # World ID verification
│   │   ├── checkin/submit   # Backend contract writes
│   │   ├── 0g/              # 0G Storage & Compute
│   │   ├── ens/             # ENS subname minting
│   │   └── agentkit/        # AgentKit demo
│   ├── components/
│   │   ├── WorldIDButton    # IDKit widget integration
│   │   ├── ENSCard          # ENS identity display
│   │   └── ManifestationToast
│   ├── lib/
│   │   ├── contract.ts      # ZenAgentRegistry ABI
│   │   ├── 0g.ts            # 0G SDK integration
│   │   └── ens.ts           # ENS.js integration
│   └── app/
│       ├── onboarding/      # 3-step onboarding
│       ├── checkin/         # Wellness check-in
│       ├── breathe/         # Breathing exercise
│       ├── insights/        # Analytics & AI letter
│       └── profile/         # ENS profile
├── contracts/
│   └── ZenAgentRegistry.sol # Solidity contract
└── README.md
```

## Environment Variables

```bash
# World ID
NEXT_PUBLIC_WORLD_APP_ID=app_bf21fa7be218bd7d3ef104b31c8f864c

# Blockchain
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://rpc.sepolia.org
ZENAGENT_REGISTRY_ADDRESS=0xA53AEc82fEa6d20df89C2b7112aE0200ea37a088

# 0G
OG_PRIVATE_KEY=your_0g_key
OG_EVM_RPC_URL=https://evmrpc-testnet.0g.ai
OG_STORAGE_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
```

## How to Run Locally

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run dev server
npm run dev

# Open http://localhost:3000
```

## Testnet Deployment

- **Contract:** Sepolia testnet
- **Frontend:** Deployed on Netlify
- **ENS:** Sepolia testnet (zenagent.eth parent)
- **0G:** 0G testnet

## Demo Mode

The app runs in demo mode for ETHGlobal Cannes 2026 with:
- Sepolia testnet
- Mock 0G responses (full SDK integration available)
- Demo ENS subnames

## Team

Built solo at ETHGlobal Cannes 2026 in 36 hours.

## License

MIT
