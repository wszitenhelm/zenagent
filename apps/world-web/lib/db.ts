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
  checkInDates: string[] // Array of unique YYYY-MM-DD dates
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

export async function saveCheckIn(checkIn: CheckIn): Promise<{ streak: number; totalCheckIns: number }> {
  const db = readDb()
  const address = checkIn.walletAddress.toLowerCase()
  
  if (!db[address]) {
    db[address] = { checkins: [], streak: 0, lastCheckIn: null, lastCheckInDate: null, checkInDates: [] }
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
  
  // New day - add to checkInDates
  if (!userData.checkInDates.includes(today)) {
    userData.checkInDates.push(today)
  }
  
  // Calculate streak based on consecutive days in checkInDates
  const sortedDates = [...userData.checkInDates].sort()
  let currentStreak = 0
  
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const date = sortedDates[i]
    const dateObj = new Date(date)
    
    if (i === sortedDates.length - 1) {
      // Most recent date - check if it's today or yesterday
      const daysDiff = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff <= 1) {
        currentStreak = 1
      } else {
        // Last check-in was more than 1 day ago, streak is 1 for today
        currentStreak = 1
        break
      }
    } else {
      // Check if consecutive with next date
      const nextDate = sortedDates[i + 1]
      const nextDateObj = new Date(nextDate)
      const dayDiff = Math.floor((nextDateObj.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))
      
      if (dayDiff === 1) {
        currentStreak++
      } else {
        break
      }
    }
  }
  
  userData.streak = Math.max(1, currentStreak)
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
