"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Trash2, Plus, ChevronDown, Loader2, Printer, ArrowLeft, Cctv, Phone, MapPin, FileQuestion, FileText, Check } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { format } from "date-fns"

const CATEGORIES = ["Camera", "DVR", "NVR", "Cable", "Power Supply", "Accessory", "Connector", "Other"]
const BRANDS = ["Hikvision", "Dahua", "CP Plus", "Uniview", "Samsung", "Honeywell", "Other"]
const PAYMENT_METHODS = ["Cash", "Bank Transfer", "JazzCash", "EasyPaisa", "Credit"]

function generateInvoiceNumber() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  return `INV-${year}${month}${day}-${hours}${minutes}`
}

function generateCustomerId() {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `C${timestamp}${random}`
}

interface LineItem {
  id: string
  item_name: string
  description: string
  category: string
  brand: string
  model_code: string
  unit_price: number
  quantity: number
  line_total: number
}

export function CreateInvoiceForm() {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [savedInvoice, setSavedInvoice] = useState<{ id: string; invoice_number: string; serial_number?: number } | null>(null)
  const [isQuotation, setIsQuotation] = useState(false)
  const [showQuotationDialog, setShowQuotationDialog] = useState(false)

  // Invoice details
  const [invoiceNumber] = useState(generateInvoiceNumber)
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [customerName, setCustomerName] = useState("")
  const [customerId] = useState(generateCustomerId)
  const [customerLocation, setCustomerLocation] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  // Line items
  const [items, setItems] = useState<LineItem[]>([])
  const [newItem, setNewItem] = useState<Partial<LineItem>>({
    item_name: "",
    description: "",
    category: "",
    brand: "",
    model_code: "",
    unit_price: 0,
    quantity: 1,
  })

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paidAmount, setPaidAmount] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [notes, setNotes] = useState("")
  const [termsConditions, setTermsConditions] = useState(
    "• Prices are subject to change without prior notice.\n• Payment is due within 30 days of invoice date.\n• Warranty is provided as per manufacturer's terms.\n• Installation charges may apply.",
  )

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0)
  const total = subtotal - discount + tax
  const remainingAmount = Math.max(0, total - paidAmount)

  const addItem = () => {
    if (!newItem.item_name || !newItem.unit_price) return

    const lineTotal = (newItem.unit_price || 0) * (newItem.quantity || 1)
    const item: LineItem = {
      id: crypto.randomUUID(),
      item_name: newItem.item_name || "",
      description: newItem.description || "",
      category: newItem.category || "",
      brand: newItem.brand || "",
      model_code: newItem.model_code || "",
      unit_price: newItem.unit_price || 0,
      quantity: newItem.quantity || 1,
      line_total: lineTotal,
    }

    setItems([...items, item])
    setNewItem({
      item_name: "",
      description: "",
      category: "",
      brand: "",
      model_code: "",
      unit_price: 0,
      quantity: 1,
    })
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleSave = async () => {
    console.log("[v0] Starting invoice save...")

    if (!customerName || items.length === 0) {
      alert("Please enter customer name and add at least one item")
      return null
    }

    setLoading(true)
    const supabase = createClient()

    try {
      let paymentStatus: "pending" | "partial" | "paid" = "pending"
      if (paidAmount >= total) {
        paymentStatus = "paid"
      } else if (paidAmount > 0) {
        paymentStatus = "partial"
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate,
          customer_name: customerName,
          customer_id: customerId,
          customer_location: customerLocation || null,
          customer_phone: customerPhone || null,
          subtotal,
          discount,
          tax,
          total,
          paid_amount: paidAmount,
          remaining_amount: remainingAmount,
          payment_method: paymentMethod || null,
          payment_status: paymentStatus,
          notes: notes || null,
          terms_conditions: termsConditions || null,
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      const itemsToInsert = items.map((item) => ({
        invoice_id: invoice.id,
        item_name: item.item_name,
        description: item.description || null,
        category: item.category || null,
        brand: item.brand || null,
        model_code: item.model_code || null,
        unit_price: item.unit_price,
        quantity: item.quantity,
        line_total: item.line_total,
      }))

      const { error: itemsError } = await supabase.from("invoice_items").insert(itemsToInsert)
      if (itemsError) throw itemsError

      setSavedInvoice({ id: invoice.id, invoice_number: invoice.invoice_number, serial_number: invoice.serial_number })
      return invoice
    } catch (error) {
      console.error("[v0] Error saving invoice:", error)
      alert("Failed to save invoice: " + (error as Error).message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const handlePrintWithSave = async () => {
    if (isQuotation) {
      setShowQuotationDialog(true)
      return
    }

    if (savedInvoice) {
      window.print()
      return
    }

    const invoice = await handleSave()
    if (invoice) {
      // Small delay to ensure state updates (like serial number) are rendered before print
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }

  const confirmQuotationPrint = () => {
    setShowQuotationDialog(false)
    // Small delay to allow the dialog overlay to fully close before printing
    setTimeout(() => {
      window.print()
    }, 500)
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
            <h1 className="text-2xl font-bold text-foreground">Create {isQuotation ? "Quotation" : "Invoice"}</h1>
            <p className="text-muted-foreground">Fill in the details below</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mr-4 print:hidden">
          <Button
            variant={isQuotation ? "default" : "outline"}
            size="sm"
            onClick={() => setIsQuotation(!isQuotation)}
            className={`font-bold flex items-center gap-2 transition-all ${isQuotation ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600' : ''}`}
          >
            {isQuotation ? <FileQuestion className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            {isQuotation ? "QUOTATION MODE" : "INVOICE MODE"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrintWithSave}>
            <Printer className="mr-2 h-4 w-4" />
            Print {isQuotation ? "Quotation" : ""}
          </Button>
          {!isQuotation && (
            !savedInvoice ? (
              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Invoice
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" /> Invoice Saved!
                </span>
                <Link href={`/invoices/${savedInvoice.id}`}>
                  <Button>View Invoice</Button>
                </Link>
              </div>
            )
          )}
        </div>
      </div>

      {savedInvoice && (
        <Card className="border-green-500 bg-green-500/10 print:hidden">
          <CardContent className="p-4">
            <p className="text-green-600 font-medium">Invoice {savedInvoice.invoice_number} saved successfully!</p>
          </CardContent>
        </Card>
      )}

      <div ref={printRef} className="space-y-6 print:p-0 print:bg-white print:text-black">
        {/* Professional Invoice Header (Print Optimized) */}
        <div className="hidden print:block border-b-4 border-foreground pb-4 mb-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex items-center gap-3">
              <Cctv className="h-10 w-10 text-foreground" />
              <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
                HK TRADER
              </h1>
              {isQuotation && (
                <div className="ml-4 px-6 py-1 border-4 border-foreground text-foreground font-black text-2xl uppercase tracking-[0.2em] skew-x-[-10deg]">
                  Quotation
                </div>
              )}
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

            <div className="flex gap-4">
              {["Wifi Camera", "Computer Networking", "Biometric Access Control"].map((service) => (
                <span
                  key={service}
                  className="px-4 py-1 border-2 border-foreground rounded-full text-xs font-bold uppercase"
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
              HK TRADER
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
                <div className="flex flex-wrap gap-1">
                  {["Wifi Camera", "Computer Networking", "Biometric Access Control"].map((service) => (
                    <span
                      key={service}
                      className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full border border-primary/20"
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
              <span className="font-bold uppercase">{customerName || "Walk-in Customer"}</span>
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">Phone:</span>
              <span className="font-bold">{customerPhone || "-"}</span>
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">Location:</span>
              <span className="font-bold uppercase">{customerLocation || "-"}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest border-b border-foreground pb-1 w-fit">
              {isQuotation ? "Quotation Details" : "Invoice Details"}
            </h3>
            <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 text-sm">
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">{isQuotation ? "Quotation #" : "Invoice #:"}</span>
              <span className="font-bold">{isQuotation ? invoiceNumber : (savedInvoice?.serial_number ?? invoiceNumber)}</span>
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">Date:</span>
              <span className="font-bold">{format(new Date(invoiceDate), "dd MMM yyyy")}</span>
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">Payment:</span>
              <span className="font-bold uppercase">{paymentMethod || "Cash"}</span>
              {!isQuotation && (
                <>
                  <span className="font-semibold text-muted-foreground uppercase text-[10px]">Status:</span>
                  <span className="font-black text-green-600 uppercase italic">
                    {paidAmount >= total ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'PENDING')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Existing Web Details (Hidden on Print) */}
        <Card className="print:hidden">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Invoice Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Invoice Number</Label>
                    <Input
                      value={savedInvoice?.serial_number ?? invoiceNumber}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label>Invoice Date</Label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Customer Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name *</Label>
                    <Input
                      placeholder="Enter customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      placeholder="Phone number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      placeholder="Location"
                      value={customerLocation}
                      onChange={(e) => setCustomerLocation(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Item Form */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-lg">Add Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="col-span-2">
                <Label>Item Name *</Label>
                <Input
                  placeholder="e.g., 8MP Camera"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Brand</Label>
                <Select value={newItem.brand} onValueChange={(value) => setNewItem({ ...newItem, brand: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANDS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model/Code</Label>
                <Input
                  placeholder="Model"
                  value={newItem.model_code}
                  onChange={(e) => setNewItem({ ...newItem, model_code: e.target.value })}
                />
              </div>
              <div>
                <Label>Unit Price *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newItem.unit_price || ""}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Qty</Label>
                <Input
                  type="number"
                  min="1"
                  value={newItem.quantity || 1}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number.parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="flex-1">
                <Label>Description (Optional)</Label>
                <Input
                  placeholder="Additional details..."
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
              </div>
              <Button onClick={addItem} className="mt-6">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
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
                <TableHead className="text-background font-black uppercase text-[10px] py-1 px-2 text-right">Unit Price</TableHead>
                <TableHead className="text-background font-black uppercase text-[10px] py-1 px-2 text-center">Qty</TableHead>
                <TableHead className="text-background font-black uppercase text-[10px] py-1 px-2 text-right">Total</TableHead>
                <TableHead className="text-background font-black uppercase text-[10px] py-1 px-2 print:hidden">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No items added yet. Use the form above to add items.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={item.id} className="border-b border-foreground/20 hover:bg-transparent">
                    <TableCell className="py-1 px-2 font-medium">{index + 1}</TableCell>
                    <TableCell className="py-1 px-2">
                      <div className="font-bold uppercase">{item.item_name}</div>
                      <div className="text-[10px] text-muted-foreground">{item.description}</div>
                      <div className="text-[10px] uppercase">{item.category} | {item.brand}</div>
                    </TableCell>
                    <TableCell className="py-1 px-2 text-right">PKR {item.unit_price.toLocaleString()}</TableCell>
                    <TableCell className="py-1 px-2 text-center font-bold">{item.quantity}</TableCell>
                    <TableCell className="py-1 px-2 text-right font-black">PKR {item.line_total.toLocaleString()}</TableCell>
                    <TableCell className="print:hidden">
                      <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
            <div className="text-[10px] space-y-1 font-medium italic whitespace-pre-line">
              {termsConditions}
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-foreground rounded-lg overflow-hidden">
              <div className="p-2 space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span>Subtotal</span>
                  <span>PKR {subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs font-bold uppercase text-red-500">
                    <span>Discount</span>
                    <span>- PKR {discount.toLocaleString()}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between text-xs font-bold uppercase">
                    <span>Tax</span>
                    <span>PKR {tax.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black uppercase border-t border-foreground mt-1 pt-1">
                  <span>Grand Total</span>
                  <span>PKR {total.toLocaleString()}</span>
                </div>
                {!isQuotation && (
                  <>
                    <div className="flex justify-between text-xs font-bold uppercase border-t border-foreground/20 mt-1 pt-1">
                      <span>Paid Amount</span>
                      <span className="text-green-600">PKR {paidAmount.toLocaleString()}</span>
                    </div>
                    {remainingAmount > 0 && (
                      <div className="flex justify-between text-xs font-bold uppercase text-red-500">
                        <span>Remaining</span>
                        <span>PKR {remainingAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}
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
          {/* Payment Details (Collapsible) */}
          <Collapsible open={showPayment} onOpenChange={setShowPayment}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Payment Details (Optional)</CardTitle>
                    <ChevronDown className={`h-5 w-5 transition-transform ${showPayment ? "rotate-180" : ""}`} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Paid Amount</Label>
                      <Input
                        type="number"
                        value={paidAmount || ""}
                        onChange={(e) => setPaidAmount(Number.parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Remaining Amount</Label>
                      <Input value={`Rs ${remainingAmount.toLocaleString()}`} disabled className="bg-muted" />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Additional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Terms & Conditions (Web) */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.target.value)}
                rows={4}
                className="text-sm resize-none"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showQuotationDialog} onOpenChange={setShowQuotationDialog}>
        <AlertDialogContent className="print:hidden">
          <AlertDialogHeader>
            <AlertDialogTitle>Create Quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a printable quotation. Quotations are not stored in the database.
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmQuotationPrint}>Confirm & Print</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
