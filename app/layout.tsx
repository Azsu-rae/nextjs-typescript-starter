import './globals.css';

import { GeistSans } from 'geist/font/sans';

let title = 'أثر — العمل التطوعي في الجزائر';
let description =
  'أثر تربط الطلبة والشباب بالجمعيات الخيرية: تطوع بمهاراتك، وثّق ساعاتك، واحصل على شهادات قابلة للمشاركة.';

export const metadata = {
  title,
  description,
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  metadataBase: new URL('https://nextjs-postgres-auth.vercel.app'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={GeistSans.variable}>{children}</body>
    </html>
  );
}
