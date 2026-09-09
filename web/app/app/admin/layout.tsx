import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col md:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-5 sm:px-6 md:px-8 md:py-6">{children}</main>
    </div>
  );
}
