// Types provided by @worldcoin/idkit v2. This shim ensures TS resolves them.
declare module '@worldcoin/idkit' {
  export const IDKitWidget: any
  export const VerificationLevel: { Orb: string; Device: string }
  export type ISuccessResult = {
    merkle_root: string
    nullifier_hash: string
    proof: string
    verification_level: string
  }
}
