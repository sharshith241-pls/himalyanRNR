import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

// Prevent static generation - requires runtime env vars
export const dynamic = 'force-dynamic';

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

  // Get role and approved status from user metadata
  const role = session.user.user_metadata?.role || 'user';
  const approved = session.user.user_metadata?.approved || false;

  if (role !== 'guide') {
    // Not a guide
    redirect('/');
  }

  if (!approved) {
    // Guide not yet approved
    redirect('/pending-approval');
  }

  return <>{children}</>;
}
