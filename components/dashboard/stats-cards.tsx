import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, DollarSign, ShoppingCart, TrendingUp, Calendar } from "lucide-react"

interface StatsCardsProps {
  totalPurchases: number
  totalQuantity: number
  totalSpending: number
  todayQuantity: number
  todaySpending: number
}

export function StatsCards({
  totalPurchases,
  totalQuantity,
  totalSpending,
  todayQuantity,
  todaySpending,
}: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const stats = [
    {
      title: "Total Purchases",
      value: totalPurchases.toLocaleString(),
      icon: ShoppingCart,
      description: "All time purchase records",
    },
    {
      title: "Total Cameras",
      value: totalQuantity.toLocaleString(),
      icon: Package,
      description: "Units in inventory",
    },
    {
      title: "Total Spending",
      value: formatCurrency(totalSpending),
      icon: DollarSign,
      description: "All time investment",
    },
    {
      title: "Today's Purchases",
      value: todayQuantity.toLocaleString(),
      icon: Calendar,
      description: "Cameras purchased today",
    },
    {
      title: "Today's Spending",
      value: formatCurrency(todaySpending),
      icon: TrendingUp,
      description: "Amount spent today",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
