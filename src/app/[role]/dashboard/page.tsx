import { PageHeader } from "@/components/shell/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Admin overview of the Edukmoko workspace." />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Review registrations under Requests, then manage roles in People.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Catalog</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Keep colleges, departments, courses, and subjects current.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Audit</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            System logs capture approvals, class joins, and module reviews.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
