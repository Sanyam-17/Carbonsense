import Link from 'next/link'

export default function Page(){
  return (
    <div className="view on" id="v-device"><div className="app"><div className="two"><div className="p"><span className="eyebrow">Device details</span><h2 className="h2" style={{fontSize:"clamp(30px,4vw,52px)"}} data-k="dn"></h2><div className="chips" id="dchips"></div><div className="tl"><div><b data-k="dw"></b><small>Right now</small></div><div><b data-k="dkwh"></b><small>kWh today</small></div><div><b data-k="dkg"></b><small>kg CO₂e</small></div></div><div data-sp="dev" data-h="110" style={{height:"110px"}}></div><div className="kv" style={{marginTop:"14px"}}><div><span>Sensor</span><b data-k="did"></b></div><div><span>Room</span>Living room</div><div><span>Status</span><b style={{color:"var(--lime)"}}>● Online</b></div></div></div><div></div></div></div></div>
  )
}
