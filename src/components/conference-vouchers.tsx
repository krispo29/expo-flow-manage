'use client'

import { useMemo, useState } from 'react'
import {
  type Conference,
  type ConferenceVoucher,
  createConferenceVoucher,
  deleteConferenceVoucher,
  getConferenceVouchers,
  importConferenceVouchers,
} from '@/app/actions/conference'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { copyTextToClipboard } from '@/lib/clipboard'
import { Copy, Loader2, Plus, Search, Ticket, Trash2, Upload } from 'lucide-react'

interface ConferenceVouchersProps {
  initialVouchers: ConferenceVoucher[]
  projectId: string
  conferences: Conference[]
}

function formatVoucherDate(value: string) {
  if (!value || value.startsWith('0001-01-01')) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function ConferenceVouchers({ initialVouchers, projectId, conferences }: Readonly<ConferenceVouchersProps>) {
  const [vouchers, setVouchers] = useState(initialVouchers)
  const [searchQuery, setSearchQuery] = useState('')
  const [newVoucherCode, setNewVoucherCode] = useState('')
  const [createConferenceUuid, setCreateConferenceUuid] = useState('')
  const [importConferenceUuid, setImportConferenceUuid] = useState('')
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [voucherToDelete, setVoucherToDelete] = useState<ConferenceVoucher | null>(null)
  const [deletingVoucherUuid, setDeletingVoucherUuid] = useState<string | null>(null)

  const filteredVouchers = useMemo(() => {
    // Deduplicate by voucher_uuid to prevent React duplicate-key warnings
    const seen = new Set<string>()
    const unique = vouchers.filter((v) => {
      if (seen.has(v.voucher_uuid)) return false
      seen.add(v.voucher_uuid)
      return true
    })

    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) return unique

    return unique.filter((voucher) =>
      voucher.voucher_code.toLowerCase().includes(keyword) ||
      voucher.conference_title?.toLowerCase().includes(keyword)
    )
  }, [searchQuery, vouchers])

  async function refreshVouchers() {
    try {
      const result = await getConferenceVouchers(projectId)
      if (result.success) {
        setVouchers(result.data || [])
      } else {
        toast.error(result.error || 'Failed to refresh vouchers')
      }
    } finally {
      // no-op
    }
  }

  async function handleCreateVoucher() {
    const code = newVoucherCode.trim()
    if (!code) {
      toast.error('Voucher code is required')
      return
    }

    if (!createConferenceUuid) {
      toast.error('Please select a conference')
      return
    }

    setIsCreating(true)
    try {
      const result = await createConferenceVoucher(code, projectId, createConferenceUuid)
      if (result.success) {
        toast.success('Voucher created')
        setNewVoucherCode('')
        await refreshVouchers()
      } else {
        toast.error(result.error || 'Failed to create voucher')
      }
    } finally {
      setIsCreating(false)
    }
  }

  function handleSelectImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    setSelectedImportFile(file)
  }

  async function handleImport() {
    if (!selectedImportFile) {
      toast.error('Please choose a file first')
      return
    }

    if (!importConferenceUuid) {
      toast.error('Please select a conference')
      return
    }

    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedImportFile)

      const result = await importConferenceVouchers(formData, projectId, importConferenceUuid)
      if (result.success) {
        toast.success('Vouchers imported')
        setSelectedImportFile(null)
        await refreshVouchers()
      } else {
        toast.error(result.error || 'Failed to import vouchers')
      }
    } finally {
      setIsImporting(false)
    }
  }

  function handleCancelImport() {
    setSelectedImportFile(null)
  }

  async function handleDeleteVoucher(voucher: ConferenceVoucher) {
    setDeletingVoucherUuid(voucher.voucher_uuid)
    try {
      const result = await deleteConferenceVoucher(voucher.voucher_uuid, projectId)
      if (result.success) {
        toast.success('Voucher deleted')
        setVoucherToDelete(null)
        await refreshVouchers()
      } else {
        toast.error(result.error || 'Failed to delete voucher')
      }
    } finally {
      setDeletingVoucherUuid(null)
    }
  }

  async function handleCopyVoucherCode(code: string) {
    try {
      await copyTextToClipboard(code)
      toast.success('Voucher code copied')
    } catch (error) {
      console.error('Failed to copy voucher code:', error)
      toast.error('Failed to copy voucher code')
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden xl:col-span-2">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-display">Create Voucher</CardTitle>
                <CardDescription className="font-medium italic">Add a single conference voucher code.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create_conference">Conference</Label>
              <Select value={createConferenceUuid} onValueChange={setCreateConferenceUuid}>
                <SelectTrigger id="create_conference" className="h-12 bg-white/5 border-white/10 rounded-2xl">
                  <SelectValue placeholder="Select a conference" />
                </SelectTrigger>
                <SelectContent>
                  {conferences.map((conf) => (
                    <SelectItem key={conf.conference_uuid} value={conf.conference_uuid}>
                      {conf.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="voucher_code">Voucher Code</Label>
              <Input
                id="voucher_code"
                value={newVoucherCode}
                onChange={(event) => setNewVoucherCode(event.target.value)}
                placeholder="e.g. XXXXXX111"
                className="h-12 bg-white/5 border-white/10 rounded-2xl"
              />
            </div>
            <Button
              onClick={handleCreateVoucher}
              disabled={isCreating}
              className="w-full rounded-2xl h-12 font-bold"
            >
              {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Voucher
            </Button>
          </CardContent>
        </Card>

        <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden xl:col-span-3">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-display">Import Vouchers</CardTitle>
                <CardDescription className="font-medium italic">Upload a file to bulk import conference vouchers.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import_conference">Conference</Label>
              <Select value={importConferenceUuid} onValueChange={setImportConferenceUuid}>
                <SelectTrigger id="import_conference" className="h-12 bg-white/5 border-white/10 rounded-2xl">
                  <SelectValue placeholder="Select a conference" />
                </SelectTrigger>
                <SelectContent>
                  {conferences.map((conf) => (
                    <SelectItem key={conf.conference_uuid} value={conf.conference_uuid}>
                      {conf.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <Input
                type="file"
                onChange={handleSelectImportFile}
                disabled={isImporting}
                className="h-12 bg-white/5 border-white/10 rounded-2xl cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-xl file:px-4 file:py-1 file:mr-4 file:font-bold file:text-xs transition-all hover:bg-white/10"
              />
              <div className="text-muted-foreground/50 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                Import key: <code>file</code>
              </div>
            </div>
            {selectedImportFile && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground break-all">{selectedImportFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedImportFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelImport}
                    disabled={isImporting}
                    className="rounded-2xl bg-white/5 border-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="rounded-2xl"
                  >
                    {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Upload
                  </Button>
                </div>
              </div>
            )}
            {isImporting && (
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading vouchers...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-6">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-display">Voucher Inventory</CardTitle>
              <CardDescription className="font-medium">
                Monitor usage and manage conference voucher activation.
              </CardDescription>
            </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search voucher code..."
                  className="pl-11 h-11 bg-white/5 border-white/10 rounded-2xl"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="md:hidden divide-y divide-white/5">
            {filteredVouchers.length === 0 ? (
              <div className="py-20 px-6 text-center text-muted-foreground italic font-medium">
                No vouchers found.
              </div>
            ) : (
              filteredVouchers.map((voucher) => (
                <div key={voucher.voucher_uuid} className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-primary" />
                        <p className="font-bold text-lg text-foreground break-all">{voucher.voucher_code}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10"
                          onClick={() => void handleCopyVoucherCode(voucher.voucher_code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      {voucher.conference_title && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">{voucher.conference_title}</p>
                      )}
                    </div>
                    <Badge className={voucher.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}>
                      {voucher.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/5 rounded-2xl border border-white/5 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Uses</p>
                      <p className="font-bold">{voucher.used_count} / {voucher.max_uses}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl border border-white/5 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold">Created</p>
                      <p className="font-bold text-xs">{formatVoucherDate(voucher.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="w-full rounded-2xl bg-red-500/5 text-red-500 border-red-500/10 hover:bg-red-500/10"
                      onClick={() => setVoucherToDelete(voucher)}
                      disabled={deletingVoucherUuid === voucher.voucher_uuid}
                    >
                      {deletingVoucherUuid === voucher.voucher_uuid ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <Table className="table-fixed">
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="pl-6 w-[26%]">Voucher Code</TableHead>
                  <TableHead className="w-[22%]">Conference</TableHead>
                  <TableHead className="w-[12%]">Usage</TableHead>
                  <TableHead className="w-[12%]">Status</TableHead>
                  <TableHead className="w-[16%]">Created At</TableHead>
                  <TableHead className="pr-6 text-right w-[12%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 italic text-muted-foreground font-medium">
                      No vouchers found in the current filter window.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVouchers.map((voucher) => (
                    <TableRow key={voucher.voucher_uuid} className="border-white/5">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <Ticket className="h-4 w-4" />
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground">{voucher.voucher_code}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10"
                              onClick={() => void handleCopyVoucherCode(voucher.voucher_code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-foreground truncate" title={voucher.conference_title || '-'}>
                          {voucher.conference_title || '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-white/5 border-white/10 font-bold">
                          {voucher.used_count} / {voucher.max_uses}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={voucher.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}>
                          {voucher.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatVoucherDate(voucher.created_at)}</TableCell>
                      <TableCell className="pr-6">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full bg-red-500/5 text-red-500 border-red-500/10 hover:bg-red-500/10"
                            onClick={() => setVoucherToDelete(voucher)}
                            disabled={deletingVoucherUuid === voucher.voucher_uuid}
                          >
                            {deletingVoucherUuid === voucher.voucher_uuid ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-2" />}
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!voucherToDelete} onOpenChange={(open) => !open && setVoucherToDelete(null)}>
        <DialogContent className="glass max-w-md border-white/10 rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-display font-bold">Confirm Delete</DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground mt-2">
              Delete voucher <span className="font-bold text-foreground">{voucherToDelete?.voucher_code}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-6 bg-white/5 border-t border-white/10 flex sm:flex-row gap-3">
            <Button
              variant="outline"
              className="rounded-2xl h-12 flex-1 bg-white/5 border-white/10"
              onClick={() => setVoucherToDelete(null)}
              disabled={!!deletingVoucherUuid}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-2xl h-12 flex-1 font-bold"
              onClick={() => voucherToDelete && handleDeleteVoucher(voucherToDelete)}
              disabled={!voucherToDelete || deletingVoucherUuid === voucherToDelete?.voucher_uuid}
            >
              {deletingVoucherUuid === voucherToDelete?.voucher_uuid ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
