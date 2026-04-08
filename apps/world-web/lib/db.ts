// Simple file-based database for check-ins
// In production, replace with PostgreSQL/Supabase

import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'checkins.json')

interface CheckIn {
  walletAddress: string
  mood: number
  stress: number
  sleep: number
  gratitude: string
  journalHash?: string
  timestamp: string
}

interface UserData {
  checkins: CheckIn[]
  streak: number
  lastCheckIn: string | null
  lastCheckInDate: string | null // YYYY-MM-DD format
}

function ensureDb() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2))
  }
}

function readDb(): Record<string, UserData> {
  ensureDb()
  const data = fs.readFileSync(DB_PATH, 'utf-8')
  return JSON.parse(data)
}

function writeDb(db: Record<string, UserData>) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

const STREAK_WINDOW_HOURS = 36

export async function saveCheckIn(checkIn: CheckIn): Promise<{ streak: number; totalCheckIns: number }> {
  const db = readDb()
  const address = checkIn.walletAddress.toLowerCase()
  
  if (!db[address]) {
    db[address] = { checkins: [], streak: 0, lastCheckIn: null, lastCheckInDate: null }
  }
  
  const userData = db[address]
  const now = new Date(checkIn.timestamp)
  const today = now.toISOString().split('T')[0] // YYYY-MM-DD
  
  // Check if already checked in today
  if (userData.lastCheckInDate === today) {
    // Already checked in today - save check-in but don't increment streak
    userData.checkins.push(checkIn)
    userData.lastCheckIn = checkIn.timestamp
    // Streak stays the same
    writeDb(db)
    return {
      streak: userData.streak,
      totalCheckIns: userData.checkins.length
    }
  }
  
  // Calculate streak for new day
  if (userData.lastCheckIn) {
    const lastCheck = new Date(userData.lastCheckIn)
    const hoursDiff = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff > STREAK_WINDOW_HOURS) {
      // Streak broken
      userData.streak = 1
    } else {
      // Continue streak
      userData.streak += 1
    }
  } else {
    // First check-in ever
    userData.streak = 1
  }
  
  userData.checkins.push(checkIn)
  userData.lastCheckIn = checkIn.timestamp
  userData.lastCheckInDate = today
  
  writeDb(db)
  
  return {
    streak: userData.streak,
    totalCheckIns: userData.checkins.length
  }
}

export async function getUserStats(walletAddress: string): Promise<{ streak: number; totalCheckIns: number }> {
  const db = readDb()
  const address = walletAddress.toLowerCase()
  
  if (!db[address]) {
    return { streak: 0, totalCheckIns: 0 }
  }
  
  return {
    streak: db[address].streak,
    totalCheckIns: db[address].checkins.length
  }
}

export async function getUserCheckIns(walletAddress: string): Promise<CheckIn[]> {
  const db = readDb()
  const address = walletAddress.toLowerCase()
  return db[address]?.checkins || []
}
