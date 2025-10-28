import { AppShell } from '@/components/layout/app-shell'

export default function ShiftsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
