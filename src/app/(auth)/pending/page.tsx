import type { Metadata } from "next"
import Link from "next/link"

import { AuthShell } from "@/components/shell/auth-shell"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Pending approval · Edukmoko" }

export default function PendingPage() {
  return (
    <AuthShell
      title="Waiting for approval"
      description="An administrator still needs to accept this account. You can sign out and try again later."
    >
      <Button asChild className="w-full">
        <Link href="/login">Return to sign in</Link>
      </Button>
    </AuthShell>
  )
}
