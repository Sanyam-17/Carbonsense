// Fail closed in production when security-relevant configuration is missing or still a placeholder.
export function assertEnv() {
  const prod = process.env.NODE_ENV === 'production', bad: string[] = []
  const need = (k: string, min: number) => { if ((process.env[k] || '').length < min) bad.push(`${k} missing or shorter than ${min} characters`) }
  need('CARBONSENSE_SESSION_SECRET', 32); need('CARBONSENSE_ACCESS_PASSWORD', 12); need('CARBONSENSE_NODE_KEYS', 10)
  if (prod && /change-me|dev-key/.test(process.env.CARBONSENSE_NODE_KEYS || '')) bad.push('CARBONSENSE_NODE_KEYS contains placeholder keys')
  if (bad.length) { const m = 'Configuration problems: ' + bad.join('; '); if (prod) throw new Error(m); console.warn(m) }
}
