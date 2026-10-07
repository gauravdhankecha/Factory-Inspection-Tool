import { redirect } from 'next/navigation';
import { currentUser, userCount } from '@/lib/auth';
import AuthForm from '@/components/AuthForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'લૉગિન — ફેક્ટરી ઇન્સ્પેક્શન' };

export default async function LoginPage() {
  if ((await userCount()) === 0) redirect('/setup');
  if (await currentUser()) redirect('/');
  return <AuthForm mode="login" />;
}
