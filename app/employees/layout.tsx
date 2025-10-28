import { AppShell } from '@/components/layout/app-shell'

export default function EmployeesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
