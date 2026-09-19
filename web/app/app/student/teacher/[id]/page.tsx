'use client';

import { use } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { TeacherProfileView } from '@/components/teacher/TeacherProfileView';

export default function StudentTeacherProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <>
      <TopBar title="Преподаватель" />
      <TeacherProfileView teacherId={id} />
    </>
  );
}
