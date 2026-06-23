import { Sidebar } from '@/components/Sidebar'
import { ToastContainer } from '@/components/Toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0f1a]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <ToastContainer />
    </div>
  )
}
