import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { MonthlyPurchasesChart } from "@/components/dashboard/monthly-purchases-chart"
import { TopShopsChart } from "@/components/dashboard/top-shops-chart"
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart"
import { DailyPurchasesChart } from "@/components/dashboard/daily-purchases-chart"
import { RecentPurchases } from "@/components/dashboard/recent-purchases"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Database } from "lucide-react"

function DatabaseSetupPrompt() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              <CardTitle>Database Setup Required</CardTitle>
            </div>
            <CardDescription>
              The database tables and views need to be created before using the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Please run the SQL scripts in order:</p>
                  <ol className="mt-2 list-inside list-decimal space-y-1">
                    <li>
                      <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                        scripts/001_create_shops_table.sql
                      </code>
                    </li>
                    <li>
                      <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                        scripts/002_create_purchased_items_table.sql
                      </code>
                    </li>
                    <li>
                      <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                        scripts/003_create_analytics_views.sql
                      </code>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Click on each SQL file in the file explorer and click the &quot;Run&quot; button to execute them. After
              running all scripts, refresh this page.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { error: tableCheckError } = await supabase.from("shops").select("id").limit(1)

  // If the shops table doesn't exist, show setup prompt
  if (
    tableCheckError?.code === "PGRST204" ||
    tableCheckError?.code === "42P01" ||
    tableCheckError?.message?.includes("does not exist")
  ) {
    return <DatabaseSetupPrompt />
  }

  let dailyAnalytics: any[] = []
  let monthlyAnalytics: any[] = []
  let categoryAnalytics: any[] = []
  let topShops: any[] = []
  let recentPurchases: any[] = []
  let totalStats: any[] = []

  try {
    const [dailyRes, monthlyRes, categoryRes, topShopsRes, recentRes, totalRes] = await Promise.all([
      supabase.from("daily_analytics").select("*").limit(30),
      supabase.from("monthly_analytics").select("*").limit(12),
      supabase.from("category_analytics").select("*"),
      supabase.from("top_shops").select("*").limit(5),
      supabase.from("purchased_items").select("*, shops(*)").order("created_at", { ascending: false }).limit(5),
      supabase.from("purchased_items").select("quantity, unit_price"),
    ])

    // Check if views exist - if any view query fails with 404, show setup prompt
    if (dailyRes.error?.code === "PGRST205" || monthlyRes.error?.code === "PGRST205") {
      return <DatabaseSetupPrompt />
    }

    dailyAnalytics = dailyRes.data || []
    monthlyAnalytics = monthlyRes.data || []
    categoryAnalytics = categoryRes.data || []
    topShops = topShopsRes.data || []
    recentPurchases = recentRes.data || []
    totalStats = totalRes.data || []
  } catch (error) {
    return <DatabaseSetupPrompt />
  }

  // Calculate total stats
  const totalQuantity = totalStats.reduce((sum, item) => sum + item.quantity, 0)
  const totalSpending = totalStats.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const totalPurchases = totalStats.length

  // Get today's stats
  const today = new Date().toISOString().split("T")[0]
  const todayStats = dailyAnalytics.find((d) => d.purchase_date === today)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <StatsCards
          totalPurchases={totalPurchases}
          totalQuantity={totalQuantity}
          totalSpending={totalSpending}
          todayQuantity={todayStats?.total_quantity || 0}
          todaySpending={todayStats?.total_amount || 0}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <MonthlyPurchasesChart data={monthlyAnalytics} />
          <TopShopsChart data={topShops} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <CategoryPieChart data={categoryAnalytics} />
          <DailyPurchasesChart data={dailyAnalytics} />
        </div>

        <div className="mt-6">
          <RecentPurchases data={recentPurchases} />
        </div>
      </main>
    </div>
  )
}
