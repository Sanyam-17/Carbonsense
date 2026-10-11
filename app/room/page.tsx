import Link from 'next/link'

export default function Page(){
  return (
    <div className="view on" id="v-room"><div className="app"><div className="dash"><div className="p"><span className="eyebrow">Room 204 · Living room · Floor 2</span><div className="mt"><small>CO₂ ppm</small><b data-k="co2"></b><div data-sp="co2"></div></div><div className="mt"><small>Temperature °C</small><b data-k="t"></b><div data-sp="t"></div></div><div className="mt"><small>Humidity %</small><b data-k="h"></b><div data-sp="h"></div></div><div className="mt"><small>Total power W</small><b data-k="pw"></b><div data-sp="pw"></div></div></div><div className="sp"></div><div className="p"><div className="ph"><span className="eyebrow">Devices</span><span className="lv"><i></i>LIVE</span></div><ul id="dl2"></ul><div className="det" style={{margin:"14px 0"}}></div><label>People <output id="po2">2</output></label><input type="range" id="ppl2" min="0" max="8" defaultValue="2" aria-label="People"/><a className="btn" id="dlnk" href="/device/ac" data-nav="/device/ac">Device details →</a></div></div></div>
<div className="tbar"><button id="b2">2D</button><button id="b3" className="on">3D</button><span className="ly"><button className="on" data-l="e">Flow</button><button className="on" data-l="a">Air</button><button className="on" data-l="c">Heat</button></span><button id="bC" className="on">Ceiling</button></div></div>
  )
}
