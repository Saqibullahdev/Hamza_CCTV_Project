import { DashboardHeader } from "@/components/dashboard/header"
import { EditInvoiceForm } from "@/components/invoices/edit-invoice-form"
import { redirect } from "next/navigation"

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
        redirect("/invoices")
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto px-4 py-8 text-black">
                <EditInvoiceForm invoiceId={id} />
            </main>
        </div>
    )
}
