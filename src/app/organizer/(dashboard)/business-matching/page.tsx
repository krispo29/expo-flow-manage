import { getBusinessMatchingReport } from '@/app/actions/business-matching-report'
import { BusinessMatchingSummary } from '@/components/business-matching/business-matching-summary'

type Props = {
  searchParams: Promise<{ eventId?: string }>
}

export default async function BusinessMatchingPage({ searchParams }: Props) {
  const { eventId } = await searchParams
  const result = await getBusinessMatchingReport({ role: 'ORGANIZER', eventId })

  return <BusinessMatchingSummary role="ORGANIZER" result={result} basePath="/organizer/business-matching" />
}
