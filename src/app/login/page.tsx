'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { loginAction, organizerLoginAction, logoutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type LoginRole = 'admin' | 'organizer'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const [loading, setLoading] = useState(false)
  const [loginRole, setLoginRole] = useState<LoginRole>('admin')
  const [mounted, setMounted] = useState(false)

  // Clear auth state (both client and server) when landing on login page
  useEffect(() => {
    logout()
    logoutAction()
  }, [logout])

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      
      const result = loginRole === 'organizer'
        ? await organizerLoginAction(formData)
        : await loginAction(formData)

      if (result.error) {
        toast.error(result.error)
        setLoading(false)
        return
      }

      if (result.success && result.user) {
        login(result.user)
        toast.success('Logged in successfully')
        
        if (loginRole === 'organizer') {
          // Organizer skips project selection, land on exhibitors page since dashboard is hidden
          router.push('/organizer/exhibitors')
        } else {
          router.push('/admin/projects')
        }
      }
    } catch {
      toast.error('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the panel.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            {/* Role Toggle */}
            <div className="grid gap-2">
              <Label>Login as</Label>
              <div className="flex rounded-lg border p-1 bg-muted/50">
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    loginRole === 'admin'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setLoginRole('admin')}
                >
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    loginRole === 'organizer'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setLoginRole('organizer')}
                >
                  <span>Organizer</span>
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" type="text" placeholder="username" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full mt-4" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <span>{loginRole === 'organizer' ? 'Sign in as Organizer' : 'Sign in'}</span>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
