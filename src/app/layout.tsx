import './globals.css'
import NavbarWrapper from './NavbarWrapper'
import { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        <NavbarWrapper />
        {children}
      </body>
    </html>
  )
}