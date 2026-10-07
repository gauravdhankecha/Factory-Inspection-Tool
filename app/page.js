import { redirect } from 'next/navigation';
import { currentUser, userCount } from '@/lib/auth';
import ToolApp from '@/components/ToolApp';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if ((await userCount()) === 0) redirect('/setup');
  const user = await currentUser();
  if (!user) redirect('/login');
  return (
    <ToolApp
      user={{ name: user.name, username: user.username, role: user.role, roleLabel: user.perms.label, canManage: user.perms.canManage }}
    />
  );
}
