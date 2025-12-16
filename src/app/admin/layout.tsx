import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminLayout as AdminLayoutComponent } from '@/components/admin/AdminLayout';
import { canAccessFormBuilder } from '@/types';
import { UserRole } from '@prisma/client';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  // Check if user has admin access
  const userRole = session.user.role as UserRole;
  if (!canAccessFormBuilder(userRole)) {
    redirect('/dashboard');
  }

  return <AdminLayoutComponent>{children}</AdminLayoutComponent>;
}
