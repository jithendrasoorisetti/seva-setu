import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SevaSetu (సేవాసేతు) - Andhra Pradesh Welfare Scheme Navigator',
  description:
    'Empowering citizens across Andhra Pradesh to find welfare schemes, understand required documents, and get pre-filled draft applications in Telugu, Hindi, and English.',
  keywords: [
    'SevaSetu',
    'Andhra Pradesh Welfare Schemes',
    'YSR Rythu Bharosa',
    'YSR Pension Kanuka',
    'Aarogyasri',
    'Grama Sachivalayam',
    'Telugu Welfare Schemes',
  ],
  authors: [{ name: 'SevaSetu Civic Tech Initiative' }],
  openGraph: {
    title: 'SevaSetu (సేవాసేతు) - Bridge to Public Services',
    description:
      'Find welfare schemes, verify required documents, and generate draft applications in Telugu, Hindi, or English.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F6B63',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      <body className="min-h-screen bg-brand-base text-brand-text antialiased flex flex-col justify-between">
        {children}
      </body>
    </html>
  );
}
