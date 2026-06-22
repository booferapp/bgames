import { redirect } from 'next/navigation'
import { checkDeveloperEligibility } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { eligible, errorCode } = await checkDeveloperEligibility()

  if (!eligible) {
    redirect(`/?error=${errorCode ?? 'BOOFER_UNAUTHENTICATED'}`)
  }

  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  )
}
