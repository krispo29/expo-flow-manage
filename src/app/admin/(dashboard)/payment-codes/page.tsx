import { PaymentCodeList } from '@/components/payment-code-list'
import { cookies } from 'next/headers'

export default async function PaymentCodesPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const params = await searchParams
  const cookieStore = await cookies()
  const projectId = params.projectId || cookieStore.get('project_uuid')?.value || ''

  if (!projectId) {
    return <div className="flex h-[50vh] flex-col items-center justify-center rounded-3xl glass p-12"><h1 className="text-2xl font-display font-bold">No Project Selected</h1><p className="mt-2 text-muted-foreground">Please select a project to manage payment codes.</p></div>
  }

  return <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"><div><h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Payment Codes</h1><p className="mt-1 text-muted-foreground">Track payment code availability and registration usage.</p></div><PaymentCodeList projectId={projectId} /></div>
}
