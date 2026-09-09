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

export const metadata: Metadata = {
  title: 'Neiron Academy — IT-школа для детей в Астане',
  description:
    'Scratch, Roblox Studio, Python и нейросети для детей 7–15 лет. Группы до 6 человек, свой проект в портфолио. Highvill, Астана.',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Neiron Academy' },
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
