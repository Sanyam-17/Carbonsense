import Link from 'next/link'

export default function Page(){
  return (
    <div className="view on" id="v-house"><div className="app"><span className="eyebrow">3 rooms · 1 floor</span><h2 className="h2">The whole <em>house.</em></h2><div className="p" style={{maxWidth:"380px",position:"fixed",left:"clamp(16px,5vw,80px)",bottom:"70px"}}><div className="tl" style={{margin:"0"}}><div><b data-k="pw"></b><small>Living W</small></div><div><b>210</b><small>Bedroom W</small></div><div><b>420</b><small>Kitchen W</small></div></div><p className="sm" style={{marginTop:"10px"}}>Click a label to open that room.</p></div></div></div>
  )
}
