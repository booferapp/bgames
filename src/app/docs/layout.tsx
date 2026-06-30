import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { DocsSidebar } from '@/components/layout/DocsSidebar'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear()

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#020202]">
      <PublicNavbar />
      <div className="flex-1 flex max-w-6xl mx-auto w-full px-6 pt-[65px] overflow-hidden lg:gap-0 gap-6">
        <DocsSidebar />
        <div className="flex-1 min-w-0 overflow-y-auto flex flex-col h-full lg:px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <article className="flex-1 py-6">
            {children}
          </article>
          <footer className="mt-10 pt-6 pb-8 border-t border-neutral-900 text-[10px] font-semibold text-neutral-600 uppercase tracking-widest shrink-0">
            &copy; {currentYear} Boofer. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  )
}
