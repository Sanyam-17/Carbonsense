import Link from 'next/link'

export default function Page(){
  return (
    <div className="view on" id="v-scan"><div className="app split"><div><span className="eyebrow">Step 1 of 3</span><h2 className="h2">Scan your <em>room.</em></h2><div className="tabs"><b className="on">Scan with iPhone</b><b>Upload 3D file</b></div><ul className="req" style={{maxWidth:"30em",padding:"0"}}><li>iPhone or iPad with LiDAR (Apple RoomPlan)</li><li>Move slowly around the room</li><li>Capture every corner</li><li>Keep the lights on</li></ul></div><div className="p"><div className="phone"></div><p className="sm" style={{margin:"10px 0"}}>Live LiDAR scanning needs the native iOS RoomPlan companion app (planned). Import a GLB scan for now.</p><Link className="btn" href="/rooms/import">Import a GLB instead</Link></div></div></div>
  )
}
