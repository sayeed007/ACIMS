'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  Package,
  TrendingDown,
  ShoppingCart,
  FileText,
  Receipt,
  DollarSign,
  BarChart3,
  Settings,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SideNavProps {
  open: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'HR & Attendance',
    items: [
      { name: 'Employees', href: '/employees', icon: Users },
      { name: 'Departments', href: '/departments', icon: Users },
      { name: 'Shifts', href: '/shifts', icon: Calendar },
      { name: 'Meal Sessions', href: '/meal-sessions', icon: Clock },
      { name: 'Eligibility Rules', href: '/eligibility', icon: CheckCircle },
    ],
  },
  {
    name: 'Inventory',
    items: [
      { name: 'Items', href: '/inventory/items', icon: Package },
      { name: 'Stock Movements', href: '/inventory/movements', icon: TrendingDown },
      { name: 'Reconciliation', href: '/inventory/reconciliations', icon: CheckCircle },
    ],
  },
  {
    name: 'Procurement',
    items: [
      { name: 'Demands', href: '/procurement/demands', icon: FileText },
      { name: 'Vendors', href: '/procurement/vendors', icon: Users },
      { name: 'Purchase Orders', href: '/procurement/orders', icon: ShoppingCart },
      { name: 'Bills', href: '/procurement/bills', icon: Receipt },
    ],
  },
  {
    name: 'Reports',
    items: [
      { name: 'Meal Reports', href: '/reports/meals', icon: BarChart3 },
      { name: 'Cost Analysis', href: '/reports/costs', icon: DollarSign },
      { name: 'Audit Log', href: '/reports/audit', icon: FileText },
    ],
  },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function SideNav({ open, onClose }: SideNavProps) {
  const pathname = usePathname()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform border-r bg-white transition-transform duration-200 dark:bg-slate-950 lg:relative lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">ACIMS</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)] px-4 py-6">
          <nav className="space-y-6">
            {navigation.map((section) =>
              'items' in section && section.items ? (
                <div key={section.name}>
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.name}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div key={section.href}>
                  <Link
                    href={section.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      pathname === section.href
                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                    )}
                  >
                    <section.icon className="h-4 w-4" />
                    {section.name}
                  </Link>
                </div>
              )
            )}
          </nav>
        </ScrollArea>
      </aside>
    </>
  )
}
