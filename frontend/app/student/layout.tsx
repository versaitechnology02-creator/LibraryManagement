'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionClient } from '@/lib/auth-client';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await getSessionClient();
        
        if (!session) {
          router.push('/login');
          return;
        }

        if (session.user.role !== 'Student') {
          // Redirect to appropriate dashboard based on role
          switch (session.user.role) {
            case 'Admin':
              router.push('/dashboard');
              break;
            case 'Staff':
              router.push('/staff');
              break;
            default:
              router.push('/login');
          }
          return;
        }
      } catch (error) {
        router.push('/login');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}