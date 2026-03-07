import { createClient, createServiceRoleClient } from '@/utils/supabase/server';
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

  // Use service role client to bypass RLS and read profile role
  const admin = createServiceRoleClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  console.log('Admin layout - user:', session.user.id, 'profile:', profile, 'error:', profileError);

  const role = profile?.role || 'user';

  if (role !== 'admin') {
    console.log('User role:', role, '- Not admin, redirecting');
    redirect('/');
  }

  return <>{children}</>;
}
