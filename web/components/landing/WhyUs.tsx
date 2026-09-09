import { WHY_US } from '@/lib/site-content';
import { Card } from '@/components/ui/Card';

export function WhyUsSection() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-center font-display text-3xl font-semibold text-white">Почему мы</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {WHY_US.map((item) => (
          <Card key={item.title} className="p-5">
            <h3 className="font-medium text-white">{item.title}</h3>
            <p className="mt-2 text-lavender">{item.text}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
