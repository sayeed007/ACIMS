import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

interface ComingSoonProps {
  title: string
  description: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card className="flex flex-col items-center justify-center py-16">
        <CardContent className="text-center">
          <div className="mb-4 inline-flex rounded-full bg-blue-50 p-4 dark:bg-blue-950">
            <Construction className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="mb-2">Under Development</CardTitle>
          <p className="text-muted-foreground">
            This feature is currently being built and will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
