"use client"

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getQuestionnaireStats, type QuestionnaireStat } from '@/app/actions/questionnaire'
import { getEvents, type Event } from '@/app/actions/settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Search, BarChart3, ListFilter, HelpCircle, Users, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function pickLabel(text?: { en?: string; vn?: string }) {
  if (!text) return '-'
  return text.en || text.vn || '-'
}

function StatsContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId') || ''
  
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<QuestionnaireStat[]>([])
  const [keyword, setKeyword] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventUuid, setSelectedEventUuid] = useState<string>('all')

  useEffect(() => {
    const fetchEvents = async () => {
      // Use projectId from URL if available, otherwise fallback is handled by the action or cookie
      const res = await getEvents(projectId)
      if (res.success && res.events) {
        setEvents(res.events)
        if (res.events.length > 0) {
          setSelectedEventUuid(res.events[0].event_uuid)
        }
      }
    }
    fetchEvents()
  }, [projectId])

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

  const stats = useMemo(() => {
    const totalQuestions = items.length
    const totalAnswers = items.reduce((acc, curr) => acc + curr.total_answers, 0)
    const avgAnswersPerQuestion = totalQuestions > 0 ? (totalAnswers / totalQuestions).toFixed(1) : 0
    return { totalQuestions, totalAnswers, avgAnswersPerQuestion }
  }, [items])

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
            Questionnaires Analysis
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-balance">
            Real-time insights and distribution data from questionnaire responses across your events.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          Live Data Feed
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Questions', value: stats.totalQuestions, icon: HelpCircle },
          { label: 'Total Responses', value: stats.totalAnswers.toLocaleString(), icon: Users },
          { label: 'Avg. Responses / Q', value: stats.avgAnswersPerQuestion, icon: CheckCircle2 },
        ].map((stat, i) => (
          <Card key={i} className="glass-elevated border-primary/5 hover:border-primary/20 transition-all duration-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-3xl font-black font-display mt-0.5">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Bar */}
      <Card className="glass border-white/5 sticky top-4 z-10 shadow-2xl shadow-black/10">
        <CardContent className="py-3">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search questions or types..."
                className="pl-9 bg-white/5 border-white/5 focus-visible:ring-primary/20 transition-all h-10 rounded-xl"
              />
            </div>
            <div className="w-full md:w-[280px]">
              <Select value={selectedEventUuid} onValueChange={setSelectedEventUuid}>
                <SelectTrigger className="bg-white/5 border-white/5 focus:ring-primary/20 h-10 rounded-xl">
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10 rounded-xl overflow-hidden">
                  <SelectItem value="all">All Events Combined</SelectItem>
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
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="relative">
            <Loader2 className="h-14 w-14 animate-spin text-primary/30" />
            <div className="absolute inset-0 h-14 w-14 blur-2xl bg-primary/20 animate-pulse" />
          </div>
          <p className="text-muted-foreground font-bold font-display uppercase tracking-widest text-xs animate-pulse">Analyzing statistics...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="glass border-dashed border-white/10 rounded-3xl">
          <CardContent className="py-20 text-center">
            <div className="inline-flex p-5 rounded-3xl bg-white/5 mb-6 border border-white/5 shadow-inner">
              <ListFilter className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold font-display">No Results Found</h3>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto text-balance">We couldn't find any questions matching your current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="detailed" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-2xl h-auto backdrop-blur-3xl shadow-xl">
              <TabsTrigger value="detailed" className="rounded-xl py-2.5 px-8 data-[state=active]:glass data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all duration-300">
                <BarChart3 className="h-4 w-4 mr-2" /> Detailed Analysis
              </TabsTrigger>
              <TabsTrigger value="overview" className="rounded-xl py-2.5 px-8 data-[state=active]:glass data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all duration-300">
                <ListFilter className="h-4 w-4 mr-2" /> High-level Overview
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="detailed" className="space-y-8 outline-none">
            {filtered
              .slice()
              .sort((a, b) => a.order_index - b.order_index)
              .map((question) => (
                <Card key={question.question_uuid} className="group border-white/5 hover:border-primary/20 transition-all duration-500 overflow-visible rounded-3xl">
                  <CardHeader className="relative pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary text-xs font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-primary/20">
                            {question.order_index}
                          </span>
                          <CardTitle className="text-2xl leading-tight font-display tracking-tight group-hover:text-primary transition-colors duration-300">
                            {pickLabel(question.question_text)}
                          </CardTitle>
                        </div>
                        {question.question_text?.vn && (
                          <p className="text-sm text-muted-foreground/50 italic font-medium pl-11">
                            {question.question_text.vn}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 sm:pl-11 md:pl-0">
                        <Badge variant="outline" className="bg-white/5 border-white/5 rounded-lg px-3 py-1 lowercase font-semibold tracking-normal text-xs backdrop-blur-md">
                          {question.question_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 rounded-lg px-3 py-1 lowercase font-bold tracking-normal text-xs shadow-[0_0_15px_rgba(var(--primary),0.05)]">
                          {question.total_answers.toLocaleString()} Answers
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 border-t border-white/5">
                    {question.options.length === 0 ? (
                      <div className="py-10 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                        <p className="text-sm text-muted-foreground font-medium italic">Open-ended question — No predefined options to analyze.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {question.options
                          .slice()
                          .sort((a, b) => b.answer_count - a.answer_count)
                          .map((option) => (
                            <div key={option.uuid} className="space-y-3 group/option">
                              <div className="flex items-center justify-between text-sm">
                                <div className="font-bold text-foreground/70 group-hover/option:text-primary transition-colors duration-300">
                                  {pickLabel(option.label)}
                                  {option.label?.vn && (
                                    <span className="ml-2 font-normal text-muted-foreground/30 italic text-[11px]">
                                      {option.label.vn}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-muted-foreground/50 text-[10px] font-black tracking-widest uppercase">
                                    {option.answer_count}
                                  </span>
                                  <span className="font-black text-primary text-base">
                                    {Number(option.percentage || 0).toFixed(1)}<span className="text-[10px] ml-0.5 opacity-50">%</span>
                                  </span>
                                </div>
                              </div>
                              <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                                <div
                                  className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary transition-all duration-1000 ease-out relative"
                                  style={{ width: `${option.percentage}%` }}
                                >
                                  <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-4 bg-primary blur-md opacity-30" />
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="overview" className="outline-none">
            <Card className="glass overflow-hidden rounded-3xl border-white/5 shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Pos</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Question Set</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-center">Type</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-right">Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered
                      .slice()
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((q) => (
                        <tr key={q.question_uuid} className="hover:bg-primary/[0.02] transition-all duration-300 group">
                          <td className="px-8 py-5">
                            <span className="text-xs font-black font-mono text-muted-foreground/30 group-hover:text-primary/50 transition-colors">
                              {q.order_index.toString().padStart(2, '0')}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="font-bold text-foreground/80 group-hover:text-primary transition-colors duration-300">
                              {pickLabel(q.question_text)}
                            </div>
                            {q.question_text?.vn && (
                              <div className="text-[11px] text-muted-foreground/40 font-medium italic mt-0.5">{q.question_text.vn}</div>
                            )}
                          </td>
                          <td className="px-8 py-5 text-center">
                            <Badge variant="outline" className="text-[9px] font-black border-white/10 bg-transparent opacity-50 group-hover:opacity-100 group-hover:border-primary/30 transition-all">
                              {q.question_type}
                            </Badge>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="font-black text-primary text-base tracking-tight">{q.total_answers.toLocaleString()}</div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default function QuestionnairesStatsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <Loader2 className="h-14 w-14 animate-spin text-primary/30" />
      </div>
    }>
      <StatsContent />
    </Suspense>
  )
}
