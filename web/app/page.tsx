import Script from 'next/script';
import { LandingHeader } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { StatsSection } from '@/components/landing/Stats';
import { CoursesSection } from '@/components/landing/Courses';
import { WhyUsSection } from '@/components/landing/WhyUs';
import { HowItWorksSection } from '@/components/landing/HowItWorks';
import { StudentWorksSection } from '@/components/landing/StudentWorks';
import { TeachersSection } from '@/components/landing/Teachers';
import { TestimonialsSection } from '@/components/landing/Testimonials';
import { PricingSection } from '@/components/landing/Pricing';
import { LocationSection } from '@/components/landing/LocationSection';
import { LeadFormSection } from '@/components/landing/LeadForm';
import { Footer } from '@/components/landing/Footer';
import { WhatsAppFab } from '@/components/landing/WhatsAppFab';
import { Reveal } from '@/components/ui/Reveal';
import { SITE } from '@/lib/site-content';
import { META_PIXEL_ID } from '@/lib/analytics';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Neiron Academy',
  description: 'IT-школа для детей 7–15 лет: Scratch, Roblox Studio, Python, нейросети.',
  address: { '@type': 'PostalAddress', addressLocality: SITE.city, addressRegion: SITE.district },
};

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}

      <LandingHeader />
      <Hero />
      <Reveal>
        <StatsSection />
      </Reveal>
      <Reveal>
        <CoursesSection />
      </Reveal>
      <Reveal>
        <WhyUsSection />
      </Reveal>
      <Reveal>
        <HowItWorksSection />
      </Reveal>
      <Reveal>
        <StudentWorksSection />
      </Reveal>
      <Reveal>
        <TeachersSection />
      </Reveal>
      <Reveal>
        <TestimonialsSection />
      </Reveal>
      <Reveal>
        <PricingSection />
      </Reveal>
      <Reveal>
        <LocationSection />
      </Reveal>
      <Reveal>
        <LeadFormSection />
      </Reveal>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
