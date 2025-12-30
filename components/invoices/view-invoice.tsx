"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Invoice, InvoiceItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Printer, Download, Share2, Phone, MapPin, Edit, Trash2, Loader2 } from "lucide-react"
import { format } from "date-fns"
import QRCode from "qrcode"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner" // Assuming sonner is used for toasts, checking package.json might be good but common in these templates

interface ViewInvoiceProps {
  invoiceId: string
}

export function ViewInvoice({ invoiceId }: ViewInvoiceProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    async function fetchInvoice() {
      const supabase = createClient()

      const [invoiceResult, itemsResult] = await Promise.all([
        supabase.from("invoices").select("*").eq("id", invoiceId).single(),
        supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId),
      ])

      if (invoiceResult.data) {
        setInvoice(invoiceResult.data)

        // Generate QR code
        const qrData = JSON.stringify({
          type: "invoice",
          id: invoiceResult.data.id,
          invoice_number: invoiceResult.data.invoice_number,
          customer: invoiceResult.data.customer_name,
          total: invoiceResult.data.total,
          date: invoiceResult.data.invoice_date,
        })

        try {
          const url = await QRCode.toDataURL(qrData, { width: 150, margin: 2 })
          setQrCodeUrl(url)
        } catch (err) {
          console.error("QR generation error:", err)
        }
      }

      if (itemsResult.data) {
        setItems(itemsResult.data)
      }

      setLoading(false)
    }

    fetchInvoice()
  }, [invoiceId])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadQR = () => {
    if (!qrCodeUrl || !invoice) return
    const link = document.createElement("a")
    link.download = `invoice-${invoice.invoice_number}-qr.png`
    link.href = qrCodeUrl
    link.click()
  }

  const handleShareWhatsApp = () => {
    if (!invoice) return
    const message = encodeURIComponent(
      `Invoice: ${invoice.invoice_number}\nCustomer: ${invoice.customer_name}\nTotal: Rs ${invoice.total.toLocaleString()}\nDate: ${format(new Date(invoice.invoice_date), "dd MMM yyyy")}`,
    )
    window.open(`https://wa.me/?text=${message}`, "_blank")
  }

  const handleDelete = async () => {
    if (!invoice) return
    setDeleteLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("invoices").delete().eq("id", invoice.id)
      if (error) throw error

      // toast.success("Invoice deleted successfully")
      router.push("/invoices")
      router.refresh()
    } catch (error: any) {
      console.error("Error deleting invoice:", error)
      alert("Failed to delete invoice: " + error.message)
    } finally {
      setDeleteLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Paid</Badge>
      case "partial":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Partial</Badge>
      default:
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Invoice not found</p>
          <Link href="/invoices" className="mt-4">
            <Button>Back to Invoices</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Invoice #{invoice.serial_number ?? invoice.invoice_number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(invoice.payment_status)}
              <span className="text-muted-foreground">{format(new Date(invoice.invoice_date), "dd MMM yyyy")}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/invoices/${invoiceId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-white" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleShareWhatsApp}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 print:gap-4 print:p-0 print:m-0">
        {/* Professional Invoice Header (Print Optimized) */}
        <div className="hidden print:block border-b-4 border-foreground pb-4 mb-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="HK TRADER Logo" className="h-16 w-auto" />
              <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
                HK TRADER
              </h1>
            </div>

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Shop On 1st Floor B Block New Spinzer IT Tower University Road Peshawar</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>0312 0191921</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full max-w-2xl">
              {[
                "CCTV System",
                "Networking System",
                "Walk Through Gate",
                "Biometric Access Control",
                "Fire Alarm System",
                "Intercom System",
              ].map((service) => (
                <span
                  key={service}
                  className="px-2 py-0.5 border border-foreground rounded-full text-[9px] font-bold uppercase whitespace-nowrap"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Existing Web Header (Hidden on Print) */}
        <Card className="print:hidden">
          <CardContent className="p-6">
            <h2 className="text-center text-2xl font-bold tracking-wide mb-4 text-foreground">
              HAMZA & BROTHERS SECURITY & NETWORKING SYSTEM
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-muted rounded-lg border-l-4 border-primary">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Address</h4>
                <p className="text-sm text-foreground">
                  Shop On 1st Floor B Block New Spinzer IT Tower University Road Peshawar
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg border-l-4 border-primary">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Contact</h4>
                <p className="text-sm text-foreground">Mob: 0312 0191921</p>
              </div>
              <div className="p-3 bg-muted rounded-lg border-l-4 border-primary">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Services</h4>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {[
                    "CCTV System",
                    "Networking System",
                    "Walk Through Gate",
                    "Biometric Access Control",
                    "Fire Alarm System",
                    "Intercom System",
                  ].map((service) => (
                    <span
                      key={service}
                      className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] rounded-full border border-primary/20 whitespace-nowrap text-center"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Section (Print Optimized) */}
        <div className="hidden print:grid grid-cols-2 gap-8 border-b-2 border-foreground pb-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest border-b border-foreground pb-1 w-fit">
              Customer Details
            </h3>
            <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 text-sm">
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">Name:</span>
              <span className="font-bold uppercase">{invoice.customer_name}</span>
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">Phone:</span>
              <span className="font-bold">{invoice.customer_phone || "-"}</span>
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">Location:</span>
              <span className="font-bold uppercase">{invoice.customer_location || "-"}</span>
            </div>
          </div>

          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest border-b border-foreground pb-1 w-fit">
                Invoice Details
              </h3>
              <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 text-sm">
                <span className="font-semibold text-muted-foreground uppercase text-[10px]">Invoice #:</span>
                <span className="font-bold">{invoice.serial_number ?? invoice.invoice_number}</span>
                <span className="font-semibold text-muted-foreground uppercase text-[10px]">Date:</span>
                <span className="font-bold">{format(new Date(invoice.invoice_date), "dd MMM yyyy")}</span>
                <span className="font-semibold text-muted-foreground uppercase text-[10px]">Payment:</span>
                <span className="font-bold uppercase">{invoice.payment_method || "Cash"}</span>
                <span className="font-semibold text-muted-foreground uppercase text-[10px]">Status:</span>
                <span className="font-black text-green-600 uppercase italic">
                  {invoice.payment_status === 'paid' ? 'PAID' : invoice.payment_status}
                </span>
              </div>
            </div>

            {qrCodeUrl && (
              <div className="flex flex-col items-center">
                <img src={qrCodeUrl} alt="QR" className="w-24 h-24 border border-foreground p-1" />
                <span className="text-[10px] font-bold mt-1 uppercase">Scan for details</span>
              </div>
            )}
          </div>
        </div>

        {/* Existing Web Details (Hidden on Print) */}
        <Card className="print:hidden">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Invoice Details</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Invoice #:</span>{" "}
                    <span className="font-medium">{invoice.invoice_number}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Date:</span>{" "}
                    <span className="font-medium">{format(new Date(invoice.invoice_date), "dd MMM yyyy")}</span>
                  </p>
                  {invoice.payment_method && (
                    <p>
                      <span className="text-muted-foreground">Payment:</span>{" "}
                      <span className="font-medium">{invoice.payment_method}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Customer Details</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <span className="font-medium">{invoice.customer_name}</span>
                  </p>
                  {invoice.customer_phone && (
                    <p>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      <span className="font-medium">{invoice.customer_phone}</span>
                    </p>
                  )}
                  {invoice.customer_location && (
                    <p>
                      <span className="text-muted-foreground">Location:</span>{" "}
                      <span className="font-medium">{invoice.customer_location}</span>
                    </p>
                  )}
                </div>
              </div>
              {qrCodeUrl && (
                <div className="flex flex-col items-center gap-2">
                  <img src={qrCodeUrl || "/placeholder.svg"} alt="Invoice QR Code" className="w-32 h-32" />
                  <div className="flex gap-2 print:hidden">
                    <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Items Table (Print Optimized) */}
        <div className="border-2 border-foreground overflow-hidden">
          <Table className="print:text-xs">
            <TableHeader>
              <TableRow className="bg-foreground hover:bg-foreground print:bg-foreground print:text-background border-b-2 border-foreground">
                <TableHead className="text-background font-black uppercase text-[10px] py-1 px-2">#</TableHead>
                <TableHead className="text-background font-black uppercase text-[10px] py-1 px-2">Item</TableHead>
                <TableHead className="text-background font-black uppercase text-[10px] py-1 px-2">Description</TableHead>
                <TableHead className="text-background font-black uppercase text-[10px] py-1 px-2">Category</TableHead>
                <TableHead className="text-background font-black uppercase text-[10px] py-1 px-2">Brand</TableHead>
                <TableHead className="text-background font-black uppercase text-[10px] py-1 px-2 text-right">Unit Price</TableHead>
                <TableHead className="text-background font-black uppercase text-[10px] py-1 px-2 text-center">Qty</TableHead>
                <TableHead className="text-background font-black uppercase text-[10px] py-1 px-2 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id} className="border-b border-foreground/20 hover:bg-transparent">
                  <TableCell className="py-1 px-2 font-medium">{index + 1}</TableCell>
                  <TableCell className="py-1 px-2 font-bold uppercase">{item.item_name}</TableCell>
                  <TableCell className="py-1 px-2 text-muted-foreground">{item.description || "-"}</TableCell>
                  <TableCell className="py-1 px-2 uppercase text-[10px]">{item.category || "-"}</TableCell>
                  <TableCell className="py-1 px-2 uppercase text-[10px]">{item.brand || "-"}</TableCell>
                  <TableCell className="py-1 px-2 text-right">PKR {item.unit_price.toLocaleString()}</TableCell>
                  <TableCell className="py-1 px-2 text-center font-bold">{item.quantity}</TableCell>
                  <TableCell className="py-1 px-2 text-right font-black">PKR {item.line_total.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary & Signature (Print Optimized) */}
        <div className="grid grid-cols-2 gap-8 items-start pt-4">
          {/* Terms & Conditions (Print) */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest border-b border-foreground pb-1 w-fit">
              Terms & Conditions
            </h4>
            <ul className="text-[10px] space-y-1 list-disc pl-4 font-medium italic">
              <li>Prices are subject to change without prior notice.</li>
              <li>Payment is due within 30 days of invoice date.</li>
              <li>Warranty is provided as per manufacturer's terms.</li>
              <li>Installation charges may apply.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-foreground rounded-lg overflow-hidden">
              <div className="p-2 space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span>Subtotal</span>
                  <span>PKR {invoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-black uppercase border-t border-foreground mt-1 pt-1">
                  <span>Grand Total</span>
                  <span>PKR {invoice.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase border-t border-foreground/20 mt-1 pt-1">
                  <span>Paid Amount</span>
                  <span className="text-green-600">PKR {invoice.paid_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="text-right pt-6 space-y-4">
              <div className="h-px bg-foreground w-48 ml-auto"></div>
              <p className="text-[10px] font-black uppercase tracking-widest">Authorized Signature</p>
            </div>
          </div>
        </div>

        {/* Existing Web Footer Components (Hidden on Print) */}
        <div className="print:hidden space-y-6">
          {/* Terms, Notes, etc. are already handled by hiding this parent div */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice
              #{invoice.serial_number ?? invoice.invoice_number} and all its items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
