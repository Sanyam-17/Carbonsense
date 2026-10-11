'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'

export default function Login() {
  const router = useRouter(), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr('')
    const r = await fetch('/api/login', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({password: new FormData(e.currentTarget).get('password')})})
    if (r.ok) { const next = new URLSearchParams(location.search).get('next'); router.push(next && next.startsWith('/') ? next : '/rooms'); router.refresh() }
    else setErr((await r.json().catch(() => ({}))).error || 'sign-in failed')
    setBusy(false)
  }
  return (
    <div className="view on"><div className="app split">
      <div><span className="eyebrow">Welcome back</span><h2 className="h2">Open your <em>digital twin.</em></h2><p className="sm" style={{maxWidth: '32em', fontSize: 16}}>Sign in to see every room, its power draw and its air, live.</p></div>
      <form className="p" onSubmit={submit}><h3>Sign in</h3><p className="sm">Single-owner access. Multi-user accounts come later.</p>
        <label htmlFor="pw">Password</label><input id="pw" className="t" type="password" name="password" autoComplete="current-password" required/>
        {err && <p role="alert" className="sm" style={{color: 'var(--ember)', marginTop: 10}}>{err}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form>
    </div></div>
  )
}
