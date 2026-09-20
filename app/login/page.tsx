import Link from 'next/link';
import { Form } from 'app/form';
import { signIn } from 'app/auth';
import { SubmitButton } from 'app/submit-button';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

export default function Login({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gradient-to-b from-[#f8f8f5] to-white px-4">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center sm:px-16">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/athar_logo.png"
              alt="Athar"
              width={56}
              height={56}
              className="rounded-lg"
              style={{ width: 56, height: 56, objectFit: 'cover', objectPosition: 'top' }}
            />
            <h3 className="text-xl font-semibold">تسجيل الدخول</h3>
          </div>
          <p className="text-sm text-gray-500">
            تطوع بمهاراتك. كن موثقا. <span className="font-medium text-[#1E4D38]">أثر.</span>
          </p>
        </div>
        <Form
          action={async (formData: FormData) => {
            'use server';
            try {
              // Success throws NEXT_REDIRECT internally — that's the happy path.
              // Bad credentials throw AuthError(CredentialsSignin) instead.
              await signIn('credentials', {
                redirectTo: '/protected',
                email: formData.get('email') as string,
                password: formData.get('password') as string,
              });
            } catch (error) {
              if (error instanceof AuthError) {
                redirect('/login?error=credentials');
              }
              throw error;
            }
          }}
        >
          {searchParams.error === 'credentials' && (
            <p className="rounded-md bg-red-50 p-2 text-center text-sm text-red-700">
              البريد الإلكتروني أو كلمة المرور غير صحيحة.
            </p>
          )}
          <SubmitButton>دخول</SubmitButton>
          <p className="text-center text-sm text-gray-600">
            {'ليس لديك حساب؟ '}
            <Link href="/register" className="font-semibold text-gray-800">
              سجل مجانا
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
}
