"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { TopShop } from "@/lib/types"

interface TopShopsChartProps {
  data: TopShop[]
}

export function TopShopsChart({ data }: TopShopsChartProps) {
  const chartData = data.map((item) => ({
    name: item.shop_name.length > 15 ? item.shop_name.slice(0, 15) + "..." : item.shop_name,
    amount: Number(item.total_amount),
    quantity: item.total_quantity,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Shops</CardTitle>
        <CardDescription>Shops with highest purchase value</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) =>
                    new Intl.NumberFormat("en-PK", {
                      style: "currency",
                      currency: "PKR",
                    }).format(value)
                  }
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
