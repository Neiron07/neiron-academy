import { use } from 'react';
import { MobileShell } from '@/components/layout/MobileShell';
import { ParentChildHeader } from '@/components/parent/ParentChildHeader';

export default function ParentChildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <MobileShell withBottomNav={false}>
      <ParentChildHeader childId={id} />
      {children}
    </MobileShell>
  );
}
