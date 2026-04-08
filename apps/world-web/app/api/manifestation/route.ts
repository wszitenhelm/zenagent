import { NextResponse } from 'next/server'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      mood?: number
      stress?: number
      sleep?: number
      journal?: string
      gratitude?: string
      streak?: number
    }

    const { mood = 7, stress = 5, sleep = 7, streak = 0 } = body

    // Free rule-based AI - no API costs!
    const result = generateAIInsights(mood, stress, sleep, streak)

    return NextResponse.json({
      success: true,
      manifestation: result.manifestation,
      insight: result.insight,
      source: 'rule-based-ai'
    })

  } catch (err) {
    console.error('[manifestation-api] Error:', err)
    return NextResponse.json({
      success: true,
      manifestation: 'Every day is a fresh start. Embrace this moment with gratitude.',
      insight: 'Wellness is a journey. Small consistent steps create lasting change.',
      source: 'error-fallback'
    })
  }
}

function generateAIInsights(mood: number, stress: number, sleep: number, streak: number): { manifestation: string; insight: string } {
  // Dynamic manifestation based on user's state
  let manifestation = ''
  
  if (streak >= 30) {
    manifestation = `Your ${streak}-day streak is extraordinary. You've built a fortress of wellness that protects your peace daily.`
  } else if (streak >= 7) {
    manifestation = `${streak} days of consistency shows your commitment. You're becoming the person who prioritizes their wellbeing.`
  } else if (mood >= 8 && stress <= 4) {
    manifestation = 'Your calm and positive energy radiates outward. Today, you are exactly where you need to be.'
  } else if (stress >= 7) {
    manifestation = 'This stress is temporary, but your strength is permanent. Breathe deeply—you are capable of handling this.'
  } else if (sleep <= 5) {
    manifestation = 'Even with restless nights, you showed up today. Your dedication to self-care transcends fatigue.'
  } else if (mood <= 4) {
    manifestation = 'Low moods pass like clouds. Your courage to check in during difficult moments speaks to your resilience.'
  } else {
    manifestation = 'Today is a canvas for growth. Each mindful moment you create adds beauty to your life journey.'
  }

  // Personalized insight based on patterns
  let insight = ''
  
  if (stress >= 7 && sleep <= 5) {
    insight = 'High stress paired with poor sleep creates a challenging cycle. Consider a 10-minute wind-down routine tonight—your nervous system needs restoration.'
  } else if (mood <= 4 && stress >= 7) {
    insight = 'Difficult emotions often signal unmet needs. Be gentle with yourself today. Even a short walk or call to a friend can shift your state.'
  } else if (streak >= 7 && mood >= 7) {
    insight = `Your ${streak}-day momentum is building compound benefits. Consistency in wellness practices rewires the brain for resilience.`
  } else if (sleep >= 8 && mood >= 7) {
    insight = 'Quality sleep and positive mood often go hand-in-hand. Your rest investment is paying dividends in emotional wellbeing.'
  } else if (streak === 1) {
    insight = 'Starting is often the hardest part. This first check-in breaks the inertia—momentum builds from here.'
  } else if (streak === 0) {
    insight = 'Welcome back. Every wellness journey has ebbs and flows. Today is a perfect day to restart your practice.'
  } else {
    insight = `Your check-in data reveals patterns worth celebrating. At ${mood}/10 mood with ${stress}/10 stress, you're navigating your day with awareness.`
  }

  return { manifestation, insight }
}

function generateFallbackManifestation(mood: number, stress: number, streak: number): string {
  if (streak > 7) {
    return `Your commitment to ${streak} days of wellness shows incredible dedication. Each check-in reinforces your path to lasting balance and peace.`
  }
  if (mood >= 8) {
    return 'Your positive energy today is a beacon of light. Carry this warmth forward and let it illuminate your path.'
  }
  if (stress >= 7) {
    return 'Breathe deeply. This moment of tension is temporary, but your strength is permanent. Peace is within reach.'
  }
  return 'Today is a new opportunity for growth. Embrace each moment with curiosity and kindness toward yourself.'
}

function generateFallbackInsight(mood: number, stress: number, sleep: number, streak: number): string {
  if (sleep <= 5) {
    return 'Your sleep quality seems lower today. Consider a calming evening routine tonight—quality rest is the foundation of emotional resilience.'
  }
  if (stress >= 7 && mood <= 5) {
    return 'High stress paired with lower mood suggests you might need extra self-care today. Even a 5-minute walk or deep breathing can shift your state.'
  }
  if (streak > 0) {
    return `Your ${streak}-day streak reflects building momentum. Consistency in wellness practices creates compound benefits for mind and body.`
  }
  return 'Starting your wellness journey takes courage. Each check-in builds awareness, and awareness is the first step to meaningful change.'
}
