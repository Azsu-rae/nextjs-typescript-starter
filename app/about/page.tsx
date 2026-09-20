import { auth, signOut } from 'app/auth';
import { getUser } from 'app/db';
import ProfileMenu from 'app/components/profile-menu';
import Link from 'next/link';

export default async function AboutPage() {
  const session = await auth();
  const email = session?.user?.email;
  const rows = email ? await getUser(email) : [];
  const me: any = rows[0] ?? null;

  async function signOutAction() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return (
    <div className="min-h-screen bg-[#f8f8f5]">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/" aria-label="Athar home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/athar_logo.png"
              alt="Athar home"
              width={36}
              height={36}
              className="rounded-md bg-[#f8f8f5] object-cover"
              style={{ width: 36, height: 36 }}
            />
          </Link>
          {me ? (
            <ProfileMenu name={me.name ?? email ?? ''} avatarUrl={me.avatarUrl}>
              <Link href="/protected" role="menuitem" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                الفرص
              </Link>
              <Link href="/profile" role="menuitem" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                تعديل الملف
              </Link>
              <form action={signOutAction} className="border-t border-gray-100">
                <button
                  type="submit"
                  role="menuitem"
                  className="block w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100"
                >
                  تسجيل الخروج
                </button>
              </form>
            </ProfileMenu>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="rounded-md bg-[#1E4D38] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A2B]">
                حساب جديد
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm font-bold uppercase tracking-widest text-[#1E4D38]">قصتنا</p>
        <h1 className="mt-2 text-3xl font-bold">
          ثورة ثقافية في العمل التطوعي بالجزائر
        </h1>
        <div className="mt-4 space-y-4 text-gray-700">
          <p>
            تبدأ أثر من ملاحظة بسيطة: طلبة الجامعات الجزائرية — والشباب الناشط
            عموما — يريدون المساهمة، لكن الجمعيات الخيرية وتجمعات التطوع تجد
            صعوبة في إيجاد الأيادي المناسبة للمشاكل المناسبة.
          </p>
          <p>
            نبني المنصة التي تربط بينهم: يعرض الطلبة مهارات ملموسة — التدريس،
            التصميم، الترجمة، البرمجة، سواعد نهاية الأسبوع — وتنشر الجمعيات
            مشاكل محددة بدل النداءات المبهمة. كل ساعة تُسجل، تحقق منها
            الجمعية، وتتحول إلى شهادات قابلة للمشاركة تجعل التطوع محسوبا في
            السيرة الذاتية.
          </p>
          <p>
            كل هذا يعمل تحت مظلة غير ربحية ومفتوحة المصدر مهمتها مساعدة الشباب
            الجزائري على الوصول إلى المعرفة والفرص. الفروع الجامعية تبقي الأمر
            محليا: كل كلية ترى ما هو حي على أرضها.
          </p>
        </div>

        <h2 className="mt-8 text-xl font-bold">كيف تعمل المنصة</h2>
        <ol className="mt-3 space-y-3">
          {[
            ['تطوع بمهاراتك', 'أنشئ ملفا بمهنتك وحرمك ومهاراتك. تُطابَق مع المشاكل التي تناسبك — لا قوائم فعاليات عامة.'],
            ['سجل ساعات موثقة', 'قدّم، اعمل، سجل ساعاتك. الجمعية تؤكدها.'],
            ['اكسب الشهادات', 'الساعات الموثقة تصك شهادات رقمية قابلة للمشاركة مع صفحة إثبات عامة.'],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="font-semibold">{i + 1}. {title}</p>
              <p className="mt-1 text-sm text-gray-600">{body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/protected"
            className="rounded-md bg-[#1E4D38] px-6 py-3 text-center text-sm font-semibold text-white hover:bg-[#163A2B]"
          >
            تصفح الفرص
          </Link>
          <Link
            href="/organizations"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-center text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            سجل جمعية
          </Link>
        </div>
      </main>
    </div>
  );
}
