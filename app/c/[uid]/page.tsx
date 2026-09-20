import { db } from 'app/db';
import { certificates, opportunities, organizations, users } from 'app/schema';
import OrgAvatar from 'app/components/org-avatar';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// Public — no login required so certificates are shareable (CV links)
export default async function CertificatePage({
  params,
}: {
  params: { uid: string };
}) {
  const rows = await db
    .select({
      certUid: certificates.certUid,
      issuedAt: certificates.issuedAt,
      volunteerName: users.name,
      volunteerId: users.id,
      avatarUrl: users.avatarUrl,
      title: opportunities.title,
      description: opportunities.description,
      orgName: organizations.name,
      orgVerified: organizations.verified,
      orgLogoUrl: organizations.logoUrl,
    })
    .from(certificates)
    .innerJoin(users, eq(certificates.userId, users.id))
    .innerJoin(opportunities, eq(certificates.opportunityId, opportunities.id))
    .leftJoin(organizations, eq(opportunities.orgId, organizations.id))
    .where(eq(certificates.certUid, params.uid));
  const c = rows[0];
  if (!c) notFound();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f8f5] px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl">
        <p className="text-xs font-bold uppercase tracking-widest text-green-700">
          ✓ تطوع موثق
        </p>
        <div className="mt-4 flex justify-center">
          <OrgAvatar name={c.volunteerName ?? 'متطوع'} logoUrl={c.avatarUrl} size={64} />
        </div>
        <h1 className="mt-3 text-xl font-bold">{c.volunteerName ?? 'متطوع'}</h1>
        <p className="mt-1 text-sm text-gray-600">{c.title}</p>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-500">
          <OrgAvatar name={c.orgName} logoUrl={c.orgLogoUrl} size={20} />
          <span>
            {c.orgName} {c.orgVerified ? '✓' : ''}
          </span>
        </div>
        <p className="mt-4 font-mono text-xs text-gray-400">{c.certUid}</p>
        <p className="text-xs text-gray-400">
          صدرت {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString('ar') : ''} · أثر
        </p>
        <Link href="/" className="mt-6 block text-sm text-gray-600 underline">
          أثر — تطوع بمهاراتك
        </Link>
      </div>
    </div>
  );
}
