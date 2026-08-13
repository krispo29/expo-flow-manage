import { getBusinessMatchingReport } from '@/app/actions/business-matching-report'
import { BusinessMatchingSummary } from '@/components/business-matching/business-matching-summary'

type Props = {
  searchParams: Promise<{ projectId?: string; eventId?: string }>
}

export default async function BusinessMatchingPage({ searchParams }: Props) {
  const { projectId, eventId } = await searchParams
  const result = await getBusinessMatchingReport({ role: 'ADMIN', projectId, eventId })

  return <BusinessMatchingSummary role="ADMIN" result={result} basePath="/admin/business-matching" projectId={projectId} />
}
