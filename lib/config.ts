// CARBONSENSE_NODE_KEYS="node-id:key,node-id2:key2" (keys must not contain ':' or ',')
const pairs = (s?: string): Record<string, string> => Object.fromEntries((s || '').split(',').map(x => x.trim().split(':')).filter(p => p.length === 2 && p[0] && p[1]))
export const roomFor = (nodeId: string) => pairs(process.env.CARBONSENSE_NODE_ROOMS)[nodeId] || 'room-204'
export const isSim = (nodeId: string) => nodeId.startsWith('sim-') // simulated sources are never labelled "measured"
export const homeTz = () => process.env.CARBONSENSE_HOME_TZ || 'UTC'
export const sampleIntervalS = () => +(process.env.CARBONSENSE_SAMPLE_INTERVAL_S || 5)
export const retentionDays = () => +(process.env.CARBONSENSE_RETENTION_DAYS || 7)
// No default factor on purpose: a documented, time-valid factor must be configured (source + valid-from are mandatory).
export function emissionFactor() {
  const f = Number(process.env.CARBONSENSE_EF_KG_PER_KWH), source = process.env.CARBONSENSE_EF_SOURCE, validFrom = process.env.CARBONSENSE_EF_VALID_FROM
  return Number.isFinite(f) && f >= 0 && source && validFrom ? {factor: f, source, validFrom} : null
}
