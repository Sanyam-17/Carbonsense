import Link from 'next/link'

export default function Page(){
  return (
    <div className="view on" id="v-analytics"><div className="app"><div className="two rt"><div></div><div className="p"><span className="eyebrow">Energy &amp; carbon</span><div className="tabs" id="rtabs"><b className="on">Today</b><b>Week</b><b>Month</b><b>Year</b></div><div className="tl"><div><b data-k="en"></b><small>kWh</small></div><div><b data-k="cf"></b><small>kg CO₂e</small></div><div><b data-k="peak"></b><small>Peak kW</small></div></div><div id="stk"></div><p className="sm" style={{display:"flex",gap:"14px",flexWrap:"wrap",marginTop:"10px"}}><span style={{color:"#c8ff3d"}}>■ Living</span><span style={{color:"#ff5a36"}}>■ Bedroom</span><span style={{color:"#7fd6ff"}}>■ Kitchen</span><span style={{color:"#ece8dc"}}>■ Others</span></p></div></div></div></div>
  )
}
