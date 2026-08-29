import { redirect } from 'next/navigation';
import { isAuthed } from '@/lib/auth';
import { allInquiries, allStrains, DRIVER } from '@/lib/db';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin — California Candy Cultivators', robots: { index: false } };

export default async function AdminPage() {
  if (!(await isAuthed())) redirect('/login');
  const [strains, inquiries] = await Promise.all([allStrains(), allInquiries()]);
  return <AdminClient initialStrains={strains} initialInquiries={inquiries} dataDriver={DRIVER} />;
}
