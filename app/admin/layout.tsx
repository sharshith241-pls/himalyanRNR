import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

// Prevent static generation - requires runtime env vars
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Portal',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/auth/login');

  // Check role from user metadata
  const role = session.user.user_metadata?.role || 'user';

  if (role !== 'admin') {
    console.log('User role:', role, '- Not admin, redirecting');
    redirect('/');
  }

  return <>{children}</>;
}
