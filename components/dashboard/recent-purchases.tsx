import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PurchasedItem } from "@/lib/types"

interface RecentPurchasesProps {
  data: PurchasedItem[]
}

export function RecentPurchases({ data }: RecentPurchasesProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Purchases</CardTitle>
        <CardDescription>Latest items added to inventory</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            {data.map((purchase) => (
              <div key={purchase.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{purchase.item_type}</span>
                    <Badge variant="secondary">{purchase.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">From: {purchase.shops?.shop_name || "Unknown Shop"}</p>
                  <p className="text-xs text-muted-foreground">{purchase.serial_numbers.length} serial number(s)</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {formatCurrency(purchase.unit_price * purchase.quantity)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {purchase.quantity} unit(s) @ {formatCurrency(purchase.unit_price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(purchase.purchase_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-muted-foreground">No recent purchases</div>
        )}
      </CardContent>
    </Card>
  )
}
