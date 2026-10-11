"use client"
import Link from 'next/link'
import {usePathname,useRouter} from 'next/navigation'
import {useEffect,useRef} from 'react'
import type {ReactNode} from 'react'
import {startEngine} from '@/lib/engine'

const NAV=[['Home','/'],['Rooms','/rooms'],['Dashboard','/room'],['House','/house'],['Energy','/analytics'],['Environment','/env']]
const SCREENS=[['1 Homepage','/'],['2 Sign up / Log in','/login'],['3 Scan your room','/scan'],['4 Processing scan','/processing'],['5 Room selection','/rooms'],['6 3D room dashboard','/room'],['7 Device details','/device/ac'],['8 House overview','/house'],['9 Energy & carbon','/analytics'],['10 Environmental data','/env']]

export default function Shell({children}:{children:ReactNode}){
  const cv=useRef<HTMLCanvasElement>(null),tip=useRef<HTMLDivElement>(null),sw=useRef<HTMLDetailsElement>(null),eng=useRef<any>(null)
  const path=usePathname(),router=useRouter()
  useEffect(()=>{const e=startEngine(cv.current,tip.current,(p:string)=>router.push(p));eng.current=e;return()=>{e.dispose();eng.current=null}},[])
  useEffect(()=>{eng.current?.route(path);if(sw.current)sw.current.open=false},[path])
  return (<>
    <canvas id="gl" ref={cv}/>
    <div id="tip" ref={tip}/>
    <div id="lv" role="status" aria-live="polite"/>
    <header className="nav">
      <Link className="logo" href="/" style={{textDecoration:'none',color:'inherit'}}><i>◐</i> CarbonSense</Link>
      <nav>{NAV.map(([n,h])=><Link key={h} href={h} className={path===h?'on':''}>{n}</Link>)}</nav>
      <Link className="btn" href="/login">Log in</Link>
    </header>
    {children}
    <details className="sw" ref={sw}><summary>☰ Screens</summary>{SCREENS.map(([n,h])=><Link key={h} href={h}>{n}</Link>)}</details>
  </>)
}
