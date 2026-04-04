# 0G Tools (Wildcard Demo)

This folder contains standalone scripts for the **0G Wildcard** bounty:

- Encrypted journal upload/download on **0G Storage**
- Manifestation quote generation on **0G Compute**

## Setup

1) Install deps:

```sh
npm install
```

2) Provide env vars.

These scripts read from the repo root `.env` (via `dotenv/config`), so you can keep a single `.env`.

Required vars:

- `OG_EVM_RPC_URL` (default testnet is fine)
- `OG_STORAGE_INDEXER_RPC`
- `OG_PRIVATE_KEY`
- `OG_JOURNAL_PASSPHRASE`
- `OG_COMPUTE_RPC_URL`
- `OG_COMPUTE_PRIVATE_KEY`

## Run

From repo root:

```sh
npm run 0g:journal:upload -- "today I feel calmer and more focused"
npm run 0g:journal:download -- <rootHash>
npm run 0g:compute:quotes -- "Write 5 manifestation quotes about building a 7-day streak"
```
