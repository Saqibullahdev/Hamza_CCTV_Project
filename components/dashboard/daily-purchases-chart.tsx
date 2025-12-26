"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { DailyAnalytics } from "@/lib/types"

interface DailyPurchasesChartProps {
  data: DailyAnalytics[]
}

export function DailyPurchasesChart({ data }: DailyPurchasesChartProps) {
  const chartData = data
    .slice(0, 14)
    .reverse()
    .map((item) => ({
      date: new Date(item.purchase_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      count: item.total_purchases,
      quantity: item.total_quantity,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Purchase Count</CardTitle>
        <CardDescription>Number of purchases in the last 14 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="quantity" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
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
