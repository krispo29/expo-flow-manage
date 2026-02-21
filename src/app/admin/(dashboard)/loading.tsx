import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse opacity-70">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted rounded"></div>
        <div className="h-4 w-96 bg-muted rounded"></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 border border-border/40 rounded-xl bg-card">
            <div className="p-6 pb-2 flex justify-between">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </div>
            <div className="p-6 pt-2 space-y-2">
              <div className="h-8 w-16 bg-muted rounded"></div>
              <div className="h-3 w-32 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 h-[400px] border border-border/40 rounded-xl bg-card p-6 space-y-6">
          <div className="space-y-2 mb-8">
            <div className="h-6 w-48 bg-muted rounded"></div>
            <div className="h-4 w-64 bg-muted rounded"></div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-8 w-8 bg-muted rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 bg-muted rounded"></div>
                <div className="h-3 w-32 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-3 h-[400px] border border-border/40 rounded-xl bg-card p-6 space-y-6">
          <div className="space-y-2 mb-8">
            <div className="h-6 w-48 bg-muted rounded"></div>
            <div className="h-4 w-64 bg-muted rounded"></div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/40 rounded-lg p-3 space-y-2">
              <div className="h-4 w-32 bg-muted rounded"></div>
              <div className="h-3 w-24 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center my-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
      </div>
    </div>
  )
}
