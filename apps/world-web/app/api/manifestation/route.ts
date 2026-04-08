import { NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

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

    const { mood = 7, stress = 5, sleep = 7, journal = '', gratitude = '', streak = 0 } = body

    // If no Groq API key, use rule-based fallback
    if (!GROQ_API_KEY) {
      const result = generateAIInsights(mood, stress, sleep, streak)
      return NextResponse.json({
        success: true,
        manifestation: result.manifestation,
        insight: result.insight,
        source: 'rule-based-fallback'
      })
    }

    // Call Groq LLM for personalized insights
    const prompt = `You are a compassionate wellness coach. Analyze the user's journal and wellness data to create a personalized manifestation and insight.

User Wellness Data:
- Mood: ${mood}/10
- Stress: ${stress}/10
- Sleep: ${sleep}/10
- Streak: ${streak} consecutive days
- Gratitude: ${gratitude || 'Not shared'}
- Journal Entry: ${journal || 'Not shared'}

Create:
1. A personalized manifestation/affirmation (1-2 sentences, inspiring, reference their specific situation)
2. A brief wellness insight based on their journal and data patterns (2-3 sentences, actionable and supportive)

Respond ONLY in this JSON format:
{"manifestation": "...", "insight": "..."}`

    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300
      })
    })

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`)
    }

    const groqData = await groqResponse.json()
    const content = groqData.choices?.[0]?.message?.content || ''

    // Parse JSON from LLM response
    let result
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON in response')
      }
    } catch {
      // Fallback if parsing fails
      const fallback = generateAIInsights(mood, stress, sleep, streak)
      result = fallback
    }

    return NextResponse.json({
      success: true,
      manifestation: result.manifestation,
      insight: result.insight,
      source: 'groq-llm'
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
