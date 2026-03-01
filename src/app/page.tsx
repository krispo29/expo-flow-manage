import { redirect } from 'next/navigation'
import { getUserRole } from '@/app/actions/auth'

export default async function Home() {
  const role = await getUserRole()
  
  if (role === 'ORGANIZER') {
    redirect('/organizer/exhibitors')
  } else {
    redirect('/admin')
  }
}

