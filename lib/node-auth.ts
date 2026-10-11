import {createHash, timingSafeEqual} from 'node:crypto'

const pairs = (s?: string): Record<string, string> => Object.fromEntries((s || '').split(',').map(x => x.trim().split(':')).filter(p => p.length === 2 && p[0] && p[1]))
const h = (s: string) => createHash('sha256').update(s).digest()

export function authOk(nodeId: string | null, key: string | null) {
  if (!nodeId || !key) return false
  const expected = pairs(process.env.CARBONSENSE_NODE_KEYS)[nodeId]
  return !!expected && timingSafeEqual(h(expected), h(key))
}
