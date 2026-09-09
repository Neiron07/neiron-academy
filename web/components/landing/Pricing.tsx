import { PRICING } from '@/lib/site-content';
import { formatKzt } from '@/lib/format';
import { Card } from '@/components/ui/Card';

export function PricingSection() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-center font-display text-3xl font-semibold text-white">Цены</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PRICING.map((p) => (
          <Card key={p.title} className="p-5 text-center">
            <p className="text-sm text-lavender">{p.title}</p>
            <p className="mt-2 font-display text-2xl font-bold text-white">{formatKzt(p.price)}</p>
            <p className="mt-2 text-sm text-muted">{p.note}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
