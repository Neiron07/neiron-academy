import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1400px]">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-6 py-6 md:px-8">{children}</main>
    </div>
  );
}
