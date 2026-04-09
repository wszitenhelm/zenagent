// Local storage utilities for client-side only
// This file does NOT import Node.js modules like the 0G SDK

export interface LocalEntry {
  date: string
  txHash?: string
  mood: number
  stress: number
  sleep: number
  note?: string
}

export function getLocalEntries(): LocalEntry[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('zg_entries') || '[]')
}

export function saveLocalEntry(entry: LocalEntry): void {
  if (typeof window === 'undefined') return
  const entries = getLocalEntries()
  entries.push(entry)
  localStorage.setItem('zg_entries', JSON.stringify(entries))
}

export function clearLocalEntries(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('zg_entries')
}
