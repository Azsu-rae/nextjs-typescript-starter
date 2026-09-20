import './globals.css';

import { GeistSans } from 'geist/font/sans';

let title = 'Athar — volunteer work in Algeria';
let description =
  'Athar connects students and youth with charities and associations: volunteer skills, verified hours, shareable certificates.';

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
    <html lang="en">
      <body className={GeistSans.variable}>{children}</body>
    </html>
  );
}
