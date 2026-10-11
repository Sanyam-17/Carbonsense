'use client'
import {useState} from 'react'

export default function ImportRoom() {
  const [res, setRes] = useState<any>(null), [busy, setBusy] = useState(false)
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setRes(null)
    const r = await fetch('/api/rooms/room-204/model', {method: 'POST', body: new FormData(e.currentTarget)})
    setRes(await r.json().catch(() => ({error: 'unexpected response'}))); setBusy(false)
  }
  return (
    <div className="view on"><div className="app">
      <span className="eyebrow">Room import</span><h2 className="h2">Import a <em>GLB scan.</em></h2>
      <form className="p" onSubmit={go} style={{maxWidth: 520}}>
        <label htmlFor="f">GLB file (max 50 MB)</label><input id="f" className="t" type="file" name="file" accept=".glb" required/>
        <label htmlFor="u">Source units</label><select id="u" name="units" defaultValue="m" className="t"><option value="m">metres</option><option value="cm">centimetres</option><option value="mm">millimetres</option></select>
        <button className="btn" disabled={busy}>{busy ? 'Uploading…' : 'Upload and inspect'}</button>
        {res?.error && <p role="alert" className="sm" style={{color: 'var(--ember)', marginTop: 12}}>Rejected: {res.error}</p>}
        {res?.room && <div style={{marginTop: 14}}>
          <p className="sm">Steps that ran: {res.steps.join(' → ')}</p>
          <p>Measured {res.dimensions.length.toFixed(2)} × {res.dimensions.width.toFixed(2)} × {res.dimensions.height.toFixed(2)} m ({res.room.derived.area.toFixed(1)} m²)</p>
          <p className="sm">Status: awaiting manual review. Check the units. Walls, doors and appliances are not detected automatically.</p></div>}
      </form>
    </div></div>
  )
}
