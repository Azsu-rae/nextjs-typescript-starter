import { auth } from 'app/auth';
import { getUser } from 'app/db';
import TopBar from 'app/components/top-bar';
import Link from 'next/link';

export default async function Page() {
  const session = await auth();
  const email = session?.user?.email;
  const rows = email ? await getUser(email) : [];
  const me: any = rows[0] ?? null;

  return (
    <div className="relative flex min-h-screen w-screen flex-col bg-[#f8f8f5]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/home_page_bg_picture.png"
        alt="متطوعون يوضبون الطرود الغذائية في بنك الجزائر الغذائي"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="relative z-20">
        <TopBar name={me?.name ?? null} avatarUrl={me?.avatarUrl ?? null} active="/" />
      </div>

      <main className="relative z-10 mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/athar_logo.png"
          alt="Athar"
          width={120}
          height={120}
          className="rounded-2xl shadow-lg"
          style={{ width: 120, height: 120, objectFit: 'cover', objectPosition: 'top' }}
        />
        <h1 className="mt-6 text-4xl font-bold text-[#1E4D38] drop-shadow-[0_1px_12px_rgba(248,248,245,0.9)] sm:text-5xl">
          ثورة ثقافية في العمل التطوعي بالجزائر
        </h1>
        <p className="mx-auto mt-4 max-w-xl bg-[#f8f8f5]/80 px-4 py-2 text-base text-neutral-800 sm:text-lg rounded-lg">
          أثر تربط الطلبة والشباب الطموح بالجمعيات الخيرية — تطوع بمهاراتك،
          وثّق ساعاتك، واحصل على شهادات قابلة للمشاركة، وحوّل فعل الخير إلى فرص.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/protected"
            className="rounded-md bg-[#1E4D38] px-6 py-3 text-sm font-semibold text-white hover:bg-[#163A2B]"
          >
            تصفح الفرص
          </Link>
          <Link
            href="/organizations"
            className="rounded-md border-2 border-[#1E4D38] bg-[#f8f8f5]/80 px-6 py-3 text-sm font-semibold text-[#1E4D38] hover:bg-[#f8f8f5]"
          >
            سجل جمعية
          </Link>
        </div>
        {!me && (
          <p className="mt-6 bg-[#f8f8f5]/80 px-4 py-1 text-sm text-neutral-800 rounded-lg">
            متطوع بالفعل؟{' '}
            <Link href="/login" className="font-semibold text-[#1E4D38] underline">
              سجل الدخول
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
