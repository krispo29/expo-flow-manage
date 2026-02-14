import { 
  Users, 
  Contact, 
  Calendar, 
  LayoutDashboard, 
  ArrowUpRight,
  TrendingUp,
  Activity
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome back. Here is what is happening with your project.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exhibitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-emerald-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> +12%</span> from last event
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Users className="h-12 w-12" />
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Contact className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,450</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-emerald-500">+180</span> newly registered today
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Contact className="h-12 w-12" />
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conferences</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="font-semibold">8</span> sessions live now
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Calendar className="h-12 w-12" />
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Scanners</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">12</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> All systems online</span>
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
            <Activity className="h-12 w-12" />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Project Activity</CardTitle>
            <CardDescription>Real-time updates from across the event.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[
                { name: "John Doe", action: "Registered as Participant", time: "2 mins ago", type: "reg" },
                { name: "Booth #102", action: "Check-in Session: IoT Future", time: "15 mins ago", type: "checkin" },
                { name: "Global Tech Inc", action: "Updated Exhibitor Profile", time: "1 hour ago", type: "edit" },
                { name: "Sarah Williams", action: "Downloaded Badge", time: "2 hours ago", type: "badge" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center mr-4">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    {i < 3 && <div className="h-full w-px bg-muted mt-1" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.name}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Next Conferences</CardTitle>
            <CardDescription>Upcoming sessions today.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "AI Revolution 2026", room: "Ballroom A", time: "14:00 - 15:30" },
                { title: "Sustainable Energy", room: "Meeting Room 2", time: "15:45 - 17:00" },
                { title: "Cybersecurity Basics", room: "Workshop Hall", time: "17:15 - 18:30" },
              ].map((session, i) => (
                <div key={i} className="flex flex-col p-3 rounded-lg border bg-muted/30">
                  <div className="font-semibold text-sm">{session.title}</div>
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1"><LayoutDashboard className="h-3 w-3" /> {session.room}</div>
                    <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {session.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button className="w-full text-xs text-primary font-medium flex items-center justify-center gap-1 hover:underline">
                View All Sessions <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
