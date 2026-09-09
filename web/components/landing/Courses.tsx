import { backendFetch } from '@/lib/backend';
import type { PublicCourse } from '@/lib/types';
import { Card } from '@/components/ui/Card';

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

  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-center font-display text-3xl font-semibold text-white">Курсы</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {courses.map((c) => (
          <Card key={c.slug} className="p-5">
            <h3 className="font-display text-xl font-semibold text-white">{c.name}</h3>
            {(c.age_min || c.age_max) && (
              <p className="mt-1 text-sm text-lavender">
                {c.age_min}–{c.age_max} лет
              </p>
            )}
            {c.description && <p className="mt-3 text-lavender">{c.description}</p>}
          </Card>
        ))}
      </div>
    </section>
  );
}
