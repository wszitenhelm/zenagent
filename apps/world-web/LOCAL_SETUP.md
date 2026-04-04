# Local setup (do not commit secrets)

## 1) Create `apps/world-web/.env.local`
Copy-paste the block below into a new file:

```sh
# World ID 4.0
NEXT_PUBLIC_WORLD_APP_ID=app_bf21fa7be218bd7d3ef104b31c8f864c
NEXT_PUBLIC_WORLD_RP_ID=rp_7059b20849a0c774
WORLD_RP_ID=rp_7059b20849a0c774
WORLD_RP_SIGNING_KEY=0xcf04548fc0023ead95ab91c96f1194c689cf757db3c9ce1bc85d58cecfc9ac0a
NEXT_PUBLIC_WORLD_ENVIRONMENT=staging

# Sepolia onchain write
SEPOLIA_RPC_URL=
PRIVATE_KEY=
ZENAGENT_REGISTRY_ADDRESS=0xA53AEc82fEa6d20df89C2b7112aE0200ea37a088
```

## 2) Run the app
From `apps/world-web`:

```sh
npm run dev
```

Then open:
- http://localhost:3000

## 3) What “success” looks like
After you verify, the UI should show:
- `Verified and stored onchain`
- a Sepolia `txHash`
