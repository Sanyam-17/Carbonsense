const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export function createTelemetryState(overrides = {}) {
  return {
    co2: 640,
    temperatureC: 24.2,
    humidityPct: 56,
    people: 0,
    powerW: 0,
    carbonKg: 0,
    ...overrides,
  }
}

export function updateSimulatedTelemetry(state, { people = state.people, random = Math.random } = {}) {
  const next = { ...state, people }
  const targetCo2 = 450 + people * 115
  next.co2 += (targetCo2 - next.co2) * 0.12 + (random() * 16 - 8)
  next.temperatureC += (22.4 + people * 0.32 - next.temperatureC) * 0.1 + (random() * 0.06 - 0.03)
  next.humidityPct = clamp(next.humidityPct + random() * 0.8 - 0.4, 48, 64)
  next.powerW = Math.round(Math.max(0, 180 + (next.temperatureC - 22) * 55 + (random() * 20 - 10)))
  return next
}

export function appendHistory(history, sample, maxLength = 48) {
  const next = [...history, sample]
  return next.length > maxLength ? next.slice(-maxLength) : next
}
