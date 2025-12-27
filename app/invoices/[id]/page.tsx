import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { ViewInvoice } from "@/components/invoices/view-invoice"
import { CreateInvoiceForm } from "@/components/invoices/create-invoice-form"

export default async function ViewInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === "new") {
    return (
      <div className="min-h-screen bg-background print:bg-white print:min-h-0 print:h-auto">
        <div className="print:hidden">
          <DashboardHeader />
        </div>
        <main className="container mx-auto px-4 py-8 print:p-0 print:m-0 print:max-w-none print:w-full">
          <CreateInvoiceForm />
        </main>
      </div>
    )
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    redirect("/invoices")
  }

  return (
    <div className="min-h-screen bg-background print:bg-white print:min-h-0 print:h-auto">
      <div className="print:hidden">
        <DashboardHeader />
      </div>
      <main className="container mx-auto px-4 py-8 print:p-0 print:m-0 print:max-w-none print:w-full">
        <ViewInvoice invoiceId={id} />
      </main>
    </div>
  )
}
