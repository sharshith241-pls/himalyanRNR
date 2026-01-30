import { createClient, createServiceRoleClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Admin Portal',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/auth/login');

  // Use service-role client to bypass RLS policies
  const admin = createServiceRoleClient();
  const { data: profile, error } = await admin
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Error fetching admin profile:', error);
    redirect('/');
  }

  if (!profile || profile.role !== 'admin') {
    console.log('User role:', profile?.role, '- Not admin, redirecting');
    redirect('/');
  }

  return <>{children}</>;
}
