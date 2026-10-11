import './globals.css'
import type {ReactNode} from 'react'
import Shell from '@/components/Shell'

export const metadata={title:'CarbonSense — your building, breathing in 3D',description:'Live energy, air quality and carbon monitoring on a 3D model of every room.'}
export const viewport={themeColor:'#0b0d0c'}

export default function RootLayout({children}:{children:ReactNode}){
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;600&display=swap"/>
      </head>
      <body><Shell>{children}</Shell></body>
    </html>
  )
}
