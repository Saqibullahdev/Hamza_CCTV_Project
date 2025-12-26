"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { MonthlyAnalytics } from "@/lib/types"

interface MonthlyPurchasesChartProps {
  data: MonthlyAnalytics[]
}

export function MonthlyPurchasesChart({ data }: MonthlyPurchasesChartProps) {
  const chartData = data
    .slice()
    .reverse()
    .map((item) => ({
      month: new Date(item.month).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      quantity: item.total_quantity,
      amount: item.total_amount,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Purchases</CardTitle>
        <CardDescription>Camera purchases trend over the last 12 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="quantity"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
