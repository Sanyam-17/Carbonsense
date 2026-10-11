const security = [
  {key: 'X-Content-Type-Options', value: 'nosniff'},
  {key: 'X-Frame-Options', value: 'DENY'},
  {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
  {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
]
export default {reactStrictMode: true, output: 'standalone', serverExternalPackages: ['@libsql/client', 'libsql'], async headers() { return [{source: '/(.*)', headers: security}] }}
