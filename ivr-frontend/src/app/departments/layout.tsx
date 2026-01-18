import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function DepartmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
