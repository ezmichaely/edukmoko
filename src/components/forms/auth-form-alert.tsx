import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AuthFormAlert({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
