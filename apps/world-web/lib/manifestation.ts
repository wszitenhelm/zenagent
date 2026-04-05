export async function generateManifestation(
  mood: number,
  stress: number,
  journal: string,
  streak: number
): Promise<string> {
  const prompt = `You are a compassionate wellness guide for crypto users. Based on: mood ${mood}/10, stress ${stress}/10, streak ${streak} days, reflection: '${journal}'. Generate ONE powerful manifestation quote max 2 sentences. Reference their crypto journey if stress is high. Be warm not generic.`

  const res = await fetch('/api/0g/manifestation', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt }),
  }).then((r) => r.json())

  if (!res?.success) {
    throw new Error(res?.error || 'Failed to generate manifestation')
  }

  return res.quote || 'Consistency is your superpower.'
}

export async function generateWeeklyLetter(
  entries: Array<{ mood: number; stress: number; sleep: number; date: string }>
): Promise<string> {
  const avgMood = entries.reduce((sum, e) => sum + e.mood, 0) / entries.length
  const avgStress = entries.reduce((sum, e) => sum + e.stress, 0) / entries.length
  const avgSleep = entries.reduce((sum, e) => sum + e.sleep, 0) / entries.length

  const prompt = `Write a warm 3-paragraph wellness letter to a crypto builder. Their week: avg mood ${avgMood.toFixed(1)}/10, avg stress ${avgStress.toFixed(1)}/10, avg sleep ${avgSleep.toFixed(1)}/10 over ${entries.length} days. Acknowledge their consistency, offer gentle guidance for stress management, and celebrate their commitment to wellness. Sign off as 'Your ZenAgent'.`

  const res = await fetch('/api/0g/manifestation', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt }),
  }).then((r) => r.json())

  if (!res?.success) {
    throw new Error(res?.error || 'Failed to generate letter')
  }

  return res.quote || 'Your wellness journey continues. Take a moment to breathe and appreciate your progress.'
}
