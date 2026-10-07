import { redirect } from 'next/navigation';
import { userCount } from '@/lib/auth';
import AuthForm from '@/components/AuthForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'સેટઅપ — ફેક્ટરી ઇન્સ્પેક્શન' };

export default async function SetupPage() {
  if ((await userCount()) > 0) redirect('/login');
  return <AuthForm mode="setup" />;
}
