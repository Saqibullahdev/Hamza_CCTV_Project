import { DashboardHeader } from "@/components/dashboard/header"
import { CreateInvoiceForm } from "@/components/invoices/create-invoice-form"

export default function NewInvoicePage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <CreateInvoiceForm />
      </main>
    </div>
  )
}
