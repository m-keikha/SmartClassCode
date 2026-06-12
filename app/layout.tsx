import './globals.css';

import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';

const vazir = Vazirmatn({ subsets: ['arabic'] });

export const metadata: Metadata = {
  title: 'سامانه هوشمند مدیریت مدرسه',
  description: 'سیستم مدیریت نمرات و تکالیف',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazir.className} bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}