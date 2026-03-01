'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getExhibitors, deleteExhibitor, toggleStatusExhibitor, forcePasswordResetExhibitor, sendExhibitorCredentials, testLoginExhibitor } from '@/app/actions/exhibitor'
import { getOrganizerExhibitors, toggleStatusOrganizerExhibitor, forceResetPasswordOrganizerExhibitor, sendMailCredentialOrganizerExhibitor, testLoginOrganizerExhibitor } from '@/app/actions/organizer-exhibitor'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, KeyRound, Loader2, Mail, Power, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, EyeOff, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function ExhibitorsPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const { user } = useAuthStore()
  const isOrganizer = user?.role === 'ORGANIZER'
  
  const [exhibitors, setExhibitors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [selectedExhibitor, setSelectedExhibitor] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [targetEmail, setTargetEmail] = useState('')

  const [testLoginDialogOpen, setTestLoginDialogOpen] = useState(false)
  const [testLoginPassword, setTestLoginPassword] = useState('')
  const [testingLogin, setTestingLogin] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Show/Hide password state
  const [showPassword, setShowPassword] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter exhibitors based on search
  const filteredExhibitors = exhibitors.filter(item => 
    (item.username && item.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.companyName && item.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.eventName && item.eventName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.boothNo && item.boothNo.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Calculate pagination based on FILTERED data
  const totalPages = Math.ceil(filteredExhibitors.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedExhibitors = filteredExhibitors.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  // Handle search change and reset pagination
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  // Wait for fetchExhibitors
  const fetchExhibitors = async () => {
    if (!isOrganizer && !projectId) return
    setLoading(true)
    
    let result
    if (isOrganizer) {
      result = await getOrganizerExhibitors()
    } else {
      result = await getExhibitors(projectId!)
    }
    
    if (result.success && result.exhibitors) {
      setExhibitors(result.exhibitors)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchExhibitors()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isOrganizer])

  async function handleDelete(id: string) {
    toast("Delete this exhibitor?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          if (!projectId) return
          const result = await deleteExhibitor(projectId, id)
          if (result.success) {
            setExhibitors(exhibitors.filter(e => e.id !== id))
            toast.success('Exhibitor deleted')
          } else {
            toast.error('Failed to delete exhibitor')
          }
        }
      }
    })
  }

  async function handleToggleStatus(id: string) {
    let result
    if (isOrganizer) {
      result = await toggleStatusOrganizerExhibitor(id)
    } else {
      if (!projectId) return
      result = await toggleStatusExhibitor(projectId, id)
    }
    
    if (result.success) {
      toast.success('Status toggled successfully')
      fetchExhibitors()
    } else {
      toast.error('Failed to toggle status')
    }
  }

  function handleOpenPasswordDialog(exhibitor: any) {
    setSelectedExhibitor(exhibitor)
    setNewPassword(exhibitor.passwordNote || '')
    setShowPassword(false)
    setPasswordDialogOpen(true)
  }

  function handleOpenTestLoginDialog(exhibitor: any) {
    setSelectedExhibitor(exhibitor)
    setTestLoginPassword('')
    setShowPassword(false)
    setTestLoginDialogOpen(true)
  }

  function handleOpenEmailDialog(exhibitor: any) {
    setSelectedExhibitor(exhibitor)
    setTargetEmail(exhibitor.email || exhibitor.username || '')
    setEmailDialogOpen(true)
  }

  async function handleSendCredentials() {
    if (!selectedExhibitor) return
    
    setSendingEmail(true)
    let result
    if (isOrganizer) {
      result = await sendMailCredentialOrganizerExhibitor([selectedExhibitor.id])
    } else {
      if (!projectId) return
      result = await sendExhibitorCredentials(projectId, selectedExhibitor.id)
    }
    setSendingEmail(false)
    
    if (result.success) {
      toast.success('Credentials sent successfully')
      setEmailDialogOpen(false)
    } else {
      toast.error('Failed to send credentials')
    }
  }

  async function handleResetPassword() {
    if (!selectedExhibitor) return
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    setSavingPassword(true)
    let result
    if (isOrganizer) {
      result = await forceResetPasswordOrganizerExhibitor(selectedExhibitor.id, newPassword)
    } else {
      if (!projectId) return
      result = await forcePasswordResetExhibitor(projectId, selectedExhibitor.id, newPassword)
    }
    setSavingPassword(false)
    
    if (result.success) {
      toast.success('Password reset successfully')
      setPasswordDialogOpen(false)
    } else {
      toast.error(result.error || 'Failed to reset password')
    }
  }

  async function handleTestLogin() {
    if (!selectedExhibitor) return
    if (!testLoginPassword) {
      toast.error('Password is required')
      return
    }

    setTestingLogin(true)
    
    let result
    if (isOrganizer) {
      result = await testLoginOrganizerExhibitor({
        username: selectedExhibitor.username,
        password: testLoginPassword
      })
    } else {
      if (!projectId) return
      result = await testLoginExhibitor(projectId, {
        username: selectedExhibitor.username,
        password: testLoginPassword
      })
    }
    
    setTestingLogin(false)

    if (result.success) {
      toast.success('Login Successful! Credentials are valid.')
      setTestLoginDialogOpen(false)
    } else {
      toast.error(result.error || 'Invalid credentials')
    }
  }

  if (!isOrganizer && !projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold">No Project Selected</h2>
        <p className="text-muted-foreground">Please select a project from the dashboard.</p>
        <Link href="/admin/projects">
          <Button className="mt-4" variant="outline">Select Project</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Exhibitors</h1>
        <Link href={isOrganizer ? `/admin/exhibitors/new` : `/admin/exhibitors/new?projectId=${projectId}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Exhibitor
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-none shadow-md">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-bold">All Exhibitors</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search username, company, booth..."
                className="pl-9 bg-background border-border/50 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : exhibitors.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No exhibitors found. Add one to get started.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold text-foreground">Username</TableHead>
                    <TableHead className="font-semibold text-foreground">Password Note</TableHead>
                    <TableHead className="font-semibold text-foreground">Company Name</TableHead>
                    <TableHead className="font-semibold text-foreground">Event</TableHead>
                    <TableHead className="font-semibold text-foreground">Booth No.</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-foreground">Used Quota</TableHead>
                    <TableHead className="font-semibold text-foreground">Quota Full</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExhibitors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        {searchQuery ? "No results matching your search terms." : "No exhibitors found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedExhibitors.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`}>
                        <TableCell className="font-medium">{item.username || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{item.passwordNote || '-'}</TableCell>
                        <TableCell>{item.companyName}</TableCell>
                        <TableCell>{item.eventName || '-'}</TableCell>
                        <TableCell>{item.boothNo || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? 'bg-green-500 hover:bg-green-600' : ''}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.usedQuota}</TableCell>
                        <TableCell>
                          <Badge variant={item.is_quota_full || item.isQuotaFull ? "destructive" : "secondary"}>
                            {item.is_quota_full || item.isQuotaFull ? 'Full' : 'Available'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                          
                            <Button variant="ghost" size="icon" title="Test Login" onClick={() => handleOpenTestLoginDialog(item)}>
                              <LogIn className="h-4 w-4 text-orange-500" />
                            </Button>

                            <Button variant="ghost" size="icon" title="Send Credentials" onClick={() => handleOpenEmailDialog(item)}>
                              <Mail className="h-4 w-4 text-purple-500" />
                            </Button>
                          
                            <Link href={isOrganizer ? `/admin/exhibitors/${item.id}` : `/admin/exhibitors/${item.id}?projectId=${projectId}`}>
                              <Button variant="ghost" size="icon" title="Edit/Manage">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                              <Button variant="ghost" size="icon" title="Reset Password" onClick={() => handleOpenPasswordDialog(item)}>
                              <KeyRound className="h-4 w-4 text-blue-500" />
                            </Button>
                             <Button variant="ghost" size="icon" title={item.isActive ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(item.id)}>
                              <Power className={`h-4 w-4 ${item.isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          )}

          <div className="flex items-center justify-between p-4 border-t bg-muted/10">
            <div className="text-xs text-muted-foreground italic">
              Showing <span className="font-medium">{filteredExhibitors.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredExhibitors.length)}</span> of <span className="font-medium">{filteredExhibitors.length}</span> results
            </div>
            {filteredExhibitors.length > itemsPerPage && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(1)} disabled={currentPage === 1}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage
                    if (currentPage <= 3) pageNum = i + 1
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                    else pageNum = currentPage - 2 + i

                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8 text-xs font-semibold"
                          onClick={() => goToPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    }
                    return null
                  })}
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedExhibitor?.companyName} ({selectedExhibitor?.username}).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">New Password</Label>
              <div className="col-span-3 relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  autoComplete="new-password"
                  className="pr-10" 
                  placeholder="Min 6 characters"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <div className="col-start-2 col-span-3">
                <p className="text-[10px] text-muted-foreground italic">Minimum 6 characters</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={savingPassword || newPassword.length < 6}>
              {savingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Save Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={testLoginDialogOpen} onOpenChange={setTestLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Exhibitor Login</DialogTitle>
            <DialogDescription>
              Test login for {selectedExhibitor?.companyName} ({selectedExhibitor?.username}).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Username</Label>
              <div className="col-span-3">
                <Input value={selectedExhibitor?.username || ''} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="testPassword" className="text-right">Password</Label>
               <div className="col-span-3 relative">
                <Input 
                  id="testPassword" 
                  type={showPassword ? "text" : "password"}
                  value={testLoginPassword} 
                  onChange={e => setTestLoginPassword(e.target.value)} 
                  className="pr-10" 
                  placeholder="Enter password to test"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestLoginDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTestLogin} disabled={testingLogin || !testLoginPassword}>
              {testingLogin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Test Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Credentials</DialogTitle>
            <DialogDescription>
              Send login credentials to {selectedExhibitor?.companyName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetEmail" className="text-right">Email</Label>
              <Input 
                id="targetEmail" 
                value={targetEmail} 
                onChange={e => setTargetEmail(e.target.value)} 
                className="col-span-3" 
                placeholder="example@email.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendCredentials} disabled={sendingEmail}>
              {sendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
