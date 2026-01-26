import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Guide Portal',
};

export default async function GuideLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/guide/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role,approved')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    // No profile found — require signup
    redirect('/auth/register');
  }

  if (profile.role !== 'guide') {
    // Not a guide
    redirect('/');
  }

  if (!profile.approved) {
    // Guide not yet approved
    redirect('/pending-approval');
  }

  return <>{children}</>;
}
