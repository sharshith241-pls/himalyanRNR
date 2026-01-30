import { createClient, createServiceRoleClient } from '@/utils/supabase/server';

export const metadata = {
  title: 'Admin Debug - User Profile',
};

export default async function DebugPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Not logged in</h1>
      </div>
    );
  }

  const admin = createServiceRoleClient();
  const { data: profile, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Admin Debug Info</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Session Info</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(
              {
                userId: session.user.id,
                email: session.user.email,
                hasSession: !!session,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Profile Data</h2>
          {error ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
              <p className="font-bold">Error fetching profile:</p>
              <p>{error.message}</p>
            </div>
          ) : profile ? (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
          ) : (
            <p className="text-red-600">No profile found</p>
          )}
        </div>

        <div className="mt-6">
          <p className="text-gray-600">
            <strong>Expected role:</strong> <code className="bg-yellow-100 px-2 py-1 rounded">admin</code>
          </p>
          <p className="text-gray-600 mt-2">
            <strong>Actual role:</strong>{' '}
            <code className={`px-2 py-1 rounded ${profile?.role === 'admin' ? 'bg-green-100' : 'bg-red-100'}`}>
              {profile?.role || 'NOT SET'}
            </code>
          </p>
        </div>

        {profile?.role === 'admin' && (
          <div className="mt-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
            ✅ Profile shows you ARE an admin! If you still can't access admin pages, check your browser console for errors.
          </div>
        )}
      </div>
    </div>
  );
}
