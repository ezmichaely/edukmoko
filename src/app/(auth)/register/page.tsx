import type { Metadata } from "next"
import Link from "next/link"

import { RegisterForm } from "@/components/forms/register-form"
import { AuthShell } from "@/components/shell/auth-shell"

export const metadata: Metadata = { title: "Register · Edukmoko" }

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Students and instructors can register. An admin must approve you before you can use the workspace."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
