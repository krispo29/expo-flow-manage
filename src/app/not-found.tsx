import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Large 404 number */}
      <div className="relative mb-6">
        <h1 className="text-[10rem] font-black leading-none tracking-tighter text-primary/10 select-none sm:text-[14rem]">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl bg-primary/5 px-6 py-3 backdrop-blur-sm border border-primary/10">
            <p className="text-lg font-semibold text-primary sm:text-xl">Page Not Found</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="mb-8 max-w-md text-muted-foreground">
        Sorry, the page you are looking for does not exist or has been moved.
        Please check the URL or go back to the dashboard.
      </p>

      {/* Action button */}
      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Go to Dashboard
      </Link>

      {/* Decorative gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/4 right-0 h-[400px] w-[400px] rounded-full bg-primary/3 blur-3xl" />
      </div>
    </div>
  )
}
