import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { homeForRole } from "@/lib/roles"

export default async function HomePage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  if (session.user.accountStatus === "PENDING") {
    redirect("/pending")
  }
  if (session.user.accountStatus !== "APPROVED") {
    redirect("/login")
  }
  redirect(homeForRole(session.user.role))
}
