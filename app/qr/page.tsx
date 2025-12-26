import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/header"
import { QRCodeGenerator } from "@/components/qr/qr-generator"
import { QRCodeScanner } from "@/components/qr/qr-scanner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function QRPage() {
  const supabase = await createClient()

  const { data: purchases } = await supabase
    .from("purchased_cameras")
    .select("*, shops(*)")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">QR Code Management</h1>
          <p className="text-muted-foreground">Generate QR codes for purchases or scan to look up camera details</p>
        </div>

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="generate">Generate QR</TabsTrigger>
            <TabsTrigger value="scan">Scan QR</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <QRCodeGenerator purchases={purchases || []} />
          </TabsContent>

          <TabsContent value="scan">
            <QRCodeScanner />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
