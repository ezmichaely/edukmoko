"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { registerWithPassword } from "@/app/(auth)/actions"
import { AuthFormAlert } from "@/components/forms/auth-form-alert"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function RegisterForm() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [role, setRole] = useState<"STUDENT" | "INSTRUCTOR">("STUDENT")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setSubmitting(true)
    setFormError(null)
    const result = await registerWithPassword({
      firstName: String(data.get("firstName") ?? ""),
      lastName: String(data.get("lastName") ?? ""),
      email: String(data.get("email") ?? ""),
      username: String(data.get("username") ?? ""),
      password: String(data.get("password") ?? ""),
      role,
    })
    if (result && "error" in result) {
      setFormError(result.error.message)
      setSubmitting(false)
      return
    }
    router.push(result && "redirectTo" in result ? result.redirectTo : "/pending")
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {formError ? <AuthFormAlert title="Could not register" message={formError} /> : null}
      <div className="grid grid-cols-2 gap-3">
        <FormField id="firstName" label="First name">
          <Input id="firstName" name="firstName" required />
        </FormField>
        <FormField id="lastName" label="Last name">
          <Input id="lastName" name="lastName" required />
        </FormField>
      </div>
      <FormField id="email" label="Email">
        <Input id="email" name="email" type="email" required />
      </FormField>
      <FormField id="username" label="Username">
        <Input id="username" name="username" required />
      </FormField>
      <FormField id="password" label="Password">
        <Input id="password" name="password" type="password" minLength={8} required />
      </FormField>
      <FormField id="role" label="Account type">
        <select
          id="role"
          className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
          value={role}
          onChange={(event) => setRole(event.target.value as "STUDENT" | "INSTRUCTOR")}
        >
          <option value="STUDENT">Student</option>
          <option value="INSTRUCTOR">Instructor</option>
        </select>
      </FormField>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" /> : "Create account"}
      </Button>
    </form>
  )
}
