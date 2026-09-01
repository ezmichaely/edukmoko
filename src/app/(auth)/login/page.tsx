import type { Metadata } from "next"
import Link from "next/link"

import { LoginForm } from "@/components/forms/login-form"
import { AuthShell } from "@/components/shell/auth-shell"

export const metadata: Metadata = { title: "Sign in · Edukmoko" }

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in with your campus username."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
