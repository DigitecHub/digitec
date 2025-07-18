import './globals.css'
import NavbarWrapper from './NavbarWrapper'
import Footer from '../components/Footer'
import { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        <NavbarWrapper />
        {children}
        <Footer />
      </body>
    </html>
  )
}