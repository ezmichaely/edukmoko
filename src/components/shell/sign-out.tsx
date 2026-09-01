"use client"

import type { ReactNode } from "react"

let inFlight = false

export async function endSessionNow() {
  if (inFlight) {
    return
  }
  inFlight = true
  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    })
  } catch {
    // Continue to login even if the request fails.
  }
  window.location.assign("/login")
}

export function SignOutButton({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <button type="button" className={className} onClick={() => void endSessionNow()}>
      {children}
    </button>
  )
}
