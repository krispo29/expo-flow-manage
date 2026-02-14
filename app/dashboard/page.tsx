"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, FileText, CheckCircle2, TrendingUp, ArrowUpRight } from "lucide-react"

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Registration",
      value: "12,345",
      change: "+180 from last month",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/20",
      trend: "up"
    },
    {
      title: "Conferences",
      value: "24",
      change: "Active sessions",
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/20",
      trend: "neutral"
    },
    {
      title: "Reports Generated",
      value: "573",
      change: "+24 this week",
      icon: FileText,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/20",
      trend: "up"
    },
    {
      title: "Check-ins",
      value: "8,901",
      change: "72% attendance rate",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900/20",
      trend: "up"
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in-up duration-500">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[hsl(180,25%,25%)] to-[hsl(180,25%,45%)]">Dashboard Overview</h2>
        <p className="text-muted-foreground text-lg">
          Welcome back to the Organizer Dashboard.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
            <Card key={index} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group relative">
                <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${stat.color}`}>
                    <stat.icon className="h-24 w-24 transform rotate-12 -mr-8 -mt-8" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <div className={`p-2 rounded-full ${stat.bg} ${stat.color}`}>
                        <stat.icon className="h-4 w-4" />
                    </div>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        {stat.trend === 'up' && <ArrowUpRight className="h-3 w-3 mr-1 text-emerald-500" />}
                        {stat.change}
                    </p>
                </CardContent>
            </Card>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-md border-none">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {[
                        { user: "Alice Johnson", action: "Registered for", target: "Future of Agri-Tech", time: "2 mins ago", avatar: "AJ" },
                        { user: "Bob Smith", action: "Checked in at", target: "Main Entrance", time: "15 mins ago", avatar: "BS" },
                        { user: "System", action: "Generated report", target: "Daily Visitor Summary", time: "1 hour ago", avatar: "SYS" },
                        { user: "Carol White", action: "Updated profile", target: "", time: "2 hours ago", avatar: "CW" },
                        { user: "Dave Brown", action: "Cancelled registration", target: "Sustainable Farming", time: "5 hours ago", avatar: "DB" }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center text-xs font-bold mr-4 border border-indigo-200 dark:border-indigo-800">
                                {item.avatar}
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    <span className="font-semibold text-primary">{item.user}</span> {item.action} <span className="text-muted-foreground">{item.target}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">{item.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
        <Card className="col-span-3 shadow-md border-none">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
             <CardContent className="grid gap-4">
                <Button variant="outline" className="w-full justify-start h-12 text-left font-normal hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 shadow-sm" asChild>
                    <a href="/dashboard/users">
                        <Users className="mr-3 h-5 w-5 text-blue-500" /> 
                        <div className="flex flex-col items-start">
                            <span className="font-medium">Register New User</span>
                            <span className="text-[10px] text-muted-foreground">Add a walk-in attendee</span>
                        </div>
                    </a>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 text-left font-normal hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-900/20 shadow-sm" asChild>
                    <a href="/dashboard/conferences">
                        <Calendar className="mr-3 h-5 w-5 text-purple-500" />
                         <div className="flex flex-col items-start">
                            <span className="font-medium">Manage Schedule</span>
                            <span className="text-[10px] text-muted-foreground">Edit sessions or speakers</span>
                        </div>
                    </a>
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 text-left font-normal hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-900/20 shadow-sm" asChild>
                    <a href="/dashboard/reports">
                        <FileText className="mr-3 h-5 w-5 text-amber-500" />
                         <div className="flex flex-col items-start">
                            <span className="font-medium">Print Badges</span>
                            <span className="text-[10px] text-muted-foreground">Batch printing for pre-reg</span>
                        </div>
                    </a>
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
