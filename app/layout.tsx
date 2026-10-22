import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Office Survival 1999 — The Scranton Branch",
  description:
    "Explore the interactive 3D Scranton office, talk to coworkers, assign tasks, and survive the workday.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
