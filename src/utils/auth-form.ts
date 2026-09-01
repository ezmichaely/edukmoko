export type AuthFormField =
  | "firstName"
  | "lastName"
  | "email"
  | "username"
  | "password"
  | "role"
  | "form"

export type AuthFormError = {
  field: AuthFormField
  message: string
}

export const AUTH_ERROR = {
  unknownUsername: {
    field: "username",
    message: "No account with that username.",
  },
  incorrectPassword: {
    field: "password",
    message: "Incorrect password.",
  },
  signInFailed: {
    field: "form",
    message: "Could not sign in. Try again.",
  },
  pendingApproval: {
    field: "form",
    message: "Your account is waiting for admin approval.",
  },
  rejected: {
    field: "form",
    message: "This registration was not approved.",
  },
  disabledAccount: {
    field: "form",
    message: "This login is disabled.",
  },
  usernameTaken: {
    field: "username",
    message: "That username is already taken.",
  },
  emailTaken: {
    field: "email",
    message: "That email is already registered.",
  },
} as const satisfies Record<string, AuthFormError>
