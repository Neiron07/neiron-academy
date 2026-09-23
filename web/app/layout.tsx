import type { Metadata, Viewport } from 'next';
import { Unbounded, Onest } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const unbounded = Unbounded({
  subsets: ['cyrillic', 'latin'],
  weight: ['600', '700'],
  variable: '--font-unbounded',
  display: 'swap',
});

const onest = Onest({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-onest',
  display: 'swap',
});

const SITE_URL = 'https://neiron-academy.vercel.app';
const TITLE = 'Neiron Academy — IT-школа для детей в Астане';
const DESCRIPTION =
  'Scratch, Roblox Studio, Python и нейросети для детей 7–15 лет. Группы до 6 человек, свой проект в портфолио. Highvill, Астана.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'IT школа для детей Астана',
    'программирование для детей',
    'курсы программирования для детей Астана',
    'Scratch для детей',
    'Roblox Studio для детей',
    'Python для детей',
    'нейросети для детей',
    'кружок программирования Астана',
    'Highvill IT школа',
  ],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Neiron Academy' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'Neiron Academy',
    locale: 'ru_KZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#150930',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${unbounded.variable} ${onest.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
