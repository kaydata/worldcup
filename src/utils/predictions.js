const KEY = 'wc_predictions'

export function getPredictions() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function savePrediction(matchId, pick) {
  const all = getPredictions()
  all[matchId] = { pick }
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function getMatchResult(match) {
  if (match.status !== 'FINISHED') return null
  const h = match.score?.fullTime?.home
  const a = match.score?.fullTime?.away
  if (h == null || a == null) return null
  if (h > a) return 'home'
  if (a > h) return 'away'
  return 'draw'
}

export function scorePrediction(prediction, match) {
  if (!prediction) return { correct: false, points: 0 }
  const result = getMatchResult(match)
  if (!result) return { correct: false, points: 0 }
  const correct = prediction.pick === result
  return { correct, points: correct ? 1 : 0 }
}

export function getTotalScore(predictions, matches) {
  let correct = 0
  let total = 0
  let points = 0
  for (const match of matches) {
    const pred = predictions[match.id]
    if (!pred) continue
    if (match.status !== 'FINISHED') continue
    total++
    const { correct: c, points: p } = scorePrediction(pred, match)
    if (c) correct++
    points += p
  }
  return { correct, total, points }
}
