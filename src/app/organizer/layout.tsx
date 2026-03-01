import { AuthGuard } from "@/components/auth-guard"
import { AuthErrorHandler } from "@/components/auth-error-handler"

export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <AuthErrorHandler />
      {children}
    </AuthGuard>
  )
}
