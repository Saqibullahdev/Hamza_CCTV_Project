import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/header"
import { PurchasesList } from "@/components/purchases/purchases-list"
import { AddPurchaseDialog } from "@/components/purchases/add-purchase-dialog"

export default async function PurchasesPage() {
  const supabase = await createClient()

  const [{ data: purchases }, { data: shops }] = await Promise.all([
    supabase.from("purchased_items").select("*, shops(*)").order("created_at", { ascending: false }),
    supabase.from("shops").select("*").order("shop_name"),
  ])

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Camera Purchases</h1>
            <p className="text-muted-foreground">Manage your stock entries</p>
          </div>
          <AddPurchaseDialog shops={shops || []} />
        </div>
        <PurchasesList initialPurchases={purchases || []} shops={shops || []} />
      </main>
    </div>
  )
}
