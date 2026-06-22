import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { DocsSidebar } from '@/components/layout/DocsSidebar'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-20 flex gap-12">
        <DocsSidebar />
        <article className="flex-1 min-w-0 py-6">
          {children}
        </article>
      </div>
    </>
  )
}
