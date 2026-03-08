"use client"

import { useEffect, useMemo, useState } from 'react'
import { getQuestionnaireStats, type QuestionnaireStat } from '@/app/actions/questionnaire'
import { getEvents, type Event } from '@/app/actions/settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search } from 'lucide-react'

function pickLabel(text?: { en?: string; vn?: string }) {
  if (!text) return '-'
  return text.en || text.vn || '-'
}

export default function QuestionnairesStatsPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<QuestionnaireStat[]>([])
  const [keyword, setKeyword] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventUuid, setSelectedEventUuid] = useState<string>('all')

  // We need to fetch events on mount (cannot easily import from cookies object on client if it's app router client component without action, but getEvents takes a projectUuid). 
  // Let's rely on standard cookies or omit projectUuid since Server Action handles it if we don't pass it? Wait, getEvents requires projectUuid. We might need a cookie approach or something if we didn't pass projectUuid as prop. Let's make getEvents robust or just pass '' if it handles it. 
  // Wait, I will just call getEvents(''). The Server Action uses cookieStore.get('project_uuid')?.value!

  useEffect(() => {
    const fetchEvents = async () => {
      const res = await getEvents('')
      if (res.success && res.events) {
        setEvents(res.events)
        if (res.events.length > 0) {
          // Default to the first event or 'all' if you want a global view
          setSelectedEventUuid(res.events[0].event_uuid)
        }
      }
    }
    fetchEvents()
  }, [])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const res = await getQuestionnaireStats(selectedEventUuid === 'all' ? undefined : selectedEventUuid)
      setItems(res.success ? res.data : [])
      setLoading(false)
    }

    if (events.length > 0 || selectedEventUuid === 'all') {
      void run()
    }
  }, [selectedEventUuid, events.length])

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => {
      const questionText = `${pickLabel(item.question_text)} ${item.question_text?.vn || ''}`.toLowerCase()
      return questionText.includes(q) || item.question_type.toLowerCase().includes(q)
    })
  }, [items, keyword])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Questionnaires Stats</h1>
        <p className="text-muted-foreground">Statistics by question set from questionnaire responses.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search question text or type..."
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-[300px]">
              <Select value={selectedEventUuid} onValueChange={setSelectedEventUuid}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Global (All Events)</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.event_uuid} value={e.event_uuid}>{e.event_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading questionnaire stats...
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">No questionnaire stats found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered
            .slice()
            .sort((a, b) => a.order_index - b.order_index)
            .map((question) => (
              <Card key={question.question_uuid}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{pickLabel(question.question_text)}</CardTitle>
                    <Badge variant="secondary">{question.question_type}</Badge>
                    <Badge variant="outline">Order {question.order_index}</Badge>
                    <Badge variant="outline">Answers {question.total_answers}</Badge>
                  </div>
                  <CardDescription>
                    {question.question_text?.vn ? `VN: ${question.question_text.vn}` : 'No VN label'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {question.options.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No options</p>
                  ) : (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div key={option.uuid} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2">
                          <div className="text-sm">
                            <div className="font-medium">{pickLabel(option.label)}</div>
                            {option.label?.vn ? <div className="text-muted-foreground">VN: {option.label.vn}</div> : null}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">Count {option.answer_count}</Badge>
                            <Badge variant="outline">{Number(option.percentage || 0).toFixed(2)}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
