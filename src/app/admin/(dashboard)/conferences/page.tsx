'use server'

import { ConferenceList } from '@/components/conference-list'
import { ConferenceVouchers } from '@/components/conference-vouchers'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getConferenceVouchers, getConferences } from '@/app/actions/conference'
import { getOrganizerConferences } from '@/app/actions/organizer-conference'
import { ConferenceExcelOperations } from '@/components/conference-excel'
import { getUserRole } from '@/app/actions/auth'

export default async function ConferencesPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ projectId?: string }>;
}>) {
  const resolvedSearchParams = await searchParams;
  const projectId = resolvedSearchParams.projectId || "67597e81-db17-4ff0-8479-56f737d9482a";
  const userRole = await getUserRole();

  // Use organizer endpoint if role is ORGANIZER
  const { data: conferences } = userRole === 'ORGANIZER'
    ? await getOrganizerConferences()
    : await getConferences(projectId);
  const { data: vouchers } = userRole === 'ORGANIZER'
    ? { data: [] }
    : await getConferenceVouchers(projectId)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Conferences</h1>
          <p className="text-muted-foreground mt-1">
            Manage sessions and conference schedule.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConferenceExcelOperations projectId={projectId} userRole={userRole} />
          <Link href={`/admin/conferences/new?projectId=${projectId}`}>
            <Button className="btn-aurora rounded-full px-6 font-semibold">
              <Plus className="mr-2 h-5 w-5" />
              Add Conference
            </Button>
          </Link>
        </div>
      </div>

      {userRole === 'ORGANIZER' ? (
        <ConferenceList conferences={conferences || []} projectId={projectId} userRole={userRole} />
      ) : (
        <Tabs defaultValue="conferences" className="w-full space-y-6">
          <TabsList className="glass p-1 h-auto inline-flex rounded-2xl border-white/10">
            <TabsTrigger
              value="conferences"
              className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 text-foreground/70 hover:text-foreground"
            >
              Conference List
            </TabsTrigger>
            <TabsTrigger
              value="vouchers"
              className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 text-foreground/70 hover:text-foreground"
            >
              Vouchers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conferences" className="outline-none">
            <ConferenceList conferences={conferences || []} projectId={projectId} userRole={userRole} />
          </TabsContent>
          <TabsContent value="vouchers" className="outline-none">
            <ConferenceVouchers initialVouchers={vouchers || []} projectId={projectId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
