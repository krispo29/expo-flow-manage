import { LeadScannerUsage } from '@/components/lead-scanner-usage'

export default async function LeadScannerPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { projectId } = await searchParams
  return <LeadScannerUsage projectId={projectId} />
}
