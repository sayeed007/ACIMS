import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  Utensils,
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    {
      title: "Today's Meals",
      value: '1,247',
      change: '+12%',
      icon: Utensils,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Low Stock Items',
      value: '8',
      change: 'Action needed',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Pending Approvals',
      value: '5',
      change: '2 urgent',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Monthly Spend',
      value: '₹2.4L',
      change: '+8% vs last month',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  const recentActivity = [
    {
      title: 'Stock Receipt',
      description: 'Rice - 500 kg received',
      time: '10 min ago',
    },
    {
      title: 'Guest Meal Request',
      description: 'IT Dept - 15 guests for lunch',
      time: '25 min ago',
    },
    {
      title: 'PO Approved',
      description: 'PO-2024-0145 approved',
      time: '1 hour ago',
    },
    {
      title: 'Reconciliation',
      description: 'Weekly stock reconciliation completed',
      time: '2 hours ago',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your canteen operations
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <button className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900">
              <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Record Stock Receipt</p>
                <p className="text-sm text-muted-foreground">
                  Add new inventory items
                </p>
              </div>
            </button>

            <button className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900">
              <div className="rounded-lg bg-orange-50 p-2 dark:bg-orange-950">
                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-medium">Request Guest Meals</p>
                <p className="text-sm text-muted-foreground">
                  Submit new guest meal request
                </p>
              </div>
            </button>

            <button className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900">
              <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">View Reports</p>
                <p className="text-sm text-muted-foreground">
                  Analyze consumption & costs
                </p>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
