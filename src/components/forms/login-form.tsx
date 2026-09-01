"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { loginWithPassword } from "@/app/(auth)/actions"
import { AuthFormAlert } from "@/components/forms/auth-form-alert"
import { FormField } from "@/components/forms/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSubmitting(true)
    const result = await loginWithPassword({ username, password })
    if (result && "error" in result) {
      if (result.error.field === "form") {
        setFormError(result.error.message)
      } else {
        setErrors({ [result.error.field]: result.error.message })
      }
      setSubmitting(false)
      return
    }
    if (result && "redirectTo" in result) {
      router.push(result.redirectTo)
      router.refresh()
      return
    }
    router.push("/")
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {formError ? <AuthFormAlert title="Could not sign in" message={formError} /> : null}
      <FormField id="username" label="Username" error={errors.username}>
        <Input
          id="username"
          value={username}
          autoComplete="username"
          onChange={(event) => setUsername(event.target.value)}
        />
      </FormField>
      <FormField id="password" label="Password" error={errors.password}>
        <Input
          id="password"
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" /> : "Sign in"}
      </Button>
    </form>
  )
}
