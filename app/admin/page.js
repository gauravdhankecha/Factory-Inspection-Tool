import { redirect } from 'next/navigation';
import { currentUser, ROLES } from '@/lib/auth';
import AdminPanel from '@/components/AdminPanel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'વપરાશકર્તા / બેકઅપ — ફેક્ટરી ઇન્સ્પેક્શન' };

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (!user.perms.canManage) redirect('/');
  const roles = Object.entries(ROLES).map(([key, r]) => ({ key, label: r.label }));
  return <AdminPanel me={{ id: user.id, name: user.name, roleLabel: user.perms.label }} roles={roles} />;
}
