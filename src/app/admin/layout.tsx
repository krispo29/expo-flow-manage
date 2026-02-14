import { AuthGuard } from "@/components/auth-guard"

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  )
}
