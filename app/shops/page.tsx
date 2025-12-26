import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/header"
import { ShopsList } from "@/components/shops/shops-list"
import { AddShopDialog } from "@/components/shops/add-shop-dialog"

export default async function ShopsPage() {
  const supabase = await createClient()

  const { data: shops } = await supabase.from("shops").select("*").order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Shops / Vendors</h1>
            <p className="text-muted-foreground">Manage your supplier ledger</p>
          </div>
          <AddShopDialog />
        </div>
        <ShopsList initialShops={shops || []} />
      </main>
    </div>
  )
}
