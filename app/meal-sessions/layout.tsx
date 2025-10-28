import { AppShell } from '@/components/layout/app-shell'

export default function MealSessionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
