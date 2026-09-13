import { backendFetch } from '@/lib/backend';
import type { PublicCourse } from '@/lib/types';
import { CoursesGrid } from './CoursesGrid';

async function getCourses(): Promise<PublicCourse[]> {
  try {
    const res = await backendFetch('/api/public/courses', { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function CoursesSection() {
  const courses = await getCourses();
  if (courses.length === 0) return null;
  return <CoursesGrid courses={courses} />;
}
