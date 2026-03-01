import { AuthGuard } from "@/components/auth-guard"
import { AuthErrorHandler } from "@/components/auth-error-handler"
import { getUserRole } from "@/app/actions/auth"
import { redirect } from "next/navigation"

export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const role = await getUserRole()
  
  // Prevent ORGANIZER from accessing any /admin paths
  if (role === 'ORGANIZER') {
    redirect('/organizer/exhibitors')
  }

  return (
    <AuthGuard>
      <AuthErrorHandler />
      {children}
    </AuthGuard>
  )
}
