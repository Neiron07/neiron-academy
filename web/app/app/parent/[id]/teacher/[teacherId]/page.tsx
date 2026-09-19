'use client';

import { use } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { TeacherProfileView } from '@/components/teacher/TeacherProfileView';

export default function ParentTeacherProfilePage({ params }: { params: Promise<{ id: string; teacherId: string }> }) {
  const { teacherId } = use(params);
  return (
    <>
      <TopBar title="Преподаватель" />
      <TeacherProfileView teacherId={teacherId} />
    </>
  );
}
