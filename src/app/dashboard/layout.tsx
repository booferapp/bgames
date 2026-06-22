import { redirect } from 'next/navigation'
import { checkDeveloperEligibility } from '@/lib/auth'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { eligible, errorCode } = await checkDeveloperEligibility()

  if (!eligible) {
    redirect(`/?error=${errorCode ?? 'BOOFER_UNAUTHENTICATED'}`)
  }

  return (
    <div className="flex h-screen bg-black">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col ml-56 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
