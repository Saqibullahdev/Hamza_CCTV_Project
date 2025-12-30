"use client"

import { useState, useRef, useEffect } from "react"
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
import { Trash2, Plus, ChevronDown, Loader2, Printer, ArrowLeft, Check, Save } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "JazzCash", "EasyPaisa", "Credit"]

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

interface EditInvoiceFormProps {
    invoiceId: string
}

export function EditInvoiceForm({ invoiceId }: EditInvoiceFormProps) {
    const router = useRouter()
    const supabase = createClient()
    const [fetching, setFetching] = useState(true)
    const [loading, setLoading] = useState(false)
    const [showPayment, setShowPayment] = useState(true)

    // Dynamic Data
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
    const [allBrands, setAllBrands] = useState<{ id: string; name: string; category_id: string }[]>([])
    const [filteredBrands, setFilteredBrands] = useState<{ id: string; name: string }[]>([])
    const [existingItemNames, setExistingItemNames] = useState<string[]>([])

    // Invoice details
    const [invoiceNumber, setInvoiceNumber] = useState("")
    const [serialNumber, setSerialNumber] = useState<number | null>(null)
    const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [customerName, setCustomerName] = useState("")
    const [customerId, setCustomerId] = useState("")
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

    // Custom entry state for new item
    const [isCustomCategory, setIsCustomCategory] = useState(false)
    const [customCategoryName, setCustomCategoryName] = useState("")
    const [isCustomBrand, setIsCustomBrand] = useState(false)
    const [customBrandName, setCustomBrandName] = useState("")

    // Payment details
    const [paymentMethod, setPaymentMethod] = useState("")
    const [paidAmount, setPaidAmount] = useState(0)
    const [discount, setDiscount] = useState(0)
    const [tax, setTax] = useState(0)
    const [notes, setNotes] = useState("")
    const [termsConditions, setTermsConditions] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            // 1. Fetch metadata
            const [{ data: cats }, { data: brands }, { data: pCameras }, { data: iItems }] = await Promise.all([
                supabase.from("product_categories").select("*").order("name"),
                supabase.from("product_brands").select("*").order("name"),
                supabase.from("purchased_items").select("product_name"),
                supabase.from("invoice_items").select("item_name"),
            ])

            if (cats) setCategories(cats)
            if (brands) setAllBrands(brands)

            const names = new Set<string>()
            pCameras?.forEach(p => p.product_name && names.add(p.product_name))
            iItems?.forEach(i => i.item_name && names.add(i.item_name))
            setExistingItemNames(Array.from(names))

            // 2. Fetch invoice data
            const { data: invoice, error: invoiceError } = await supabase
                .from("invoices")
                .select("*")
                .eq("id", invoiceId)
                .single()

            if (invoiceError || !invoice) {
                console.error("Error fetching invoice:", invoiceError)
                alert("Failed to load invoice")
                router.push("/invoices")
                return
            }

            setInvoiceNumber(invoice.invoice_number)
            setSerialNumber(invoice.serial_number)
            setInvoiceDate(invoice.invoice_date)
            setCustomerName(invoice.customer_name)
            setCustomerId(invoice.customer_id)
            setCustomerLocation(invoice.customer_location || "")
            setCustomerPhone(invoice.customer_phone || "")
            setPaymentMethod(invoice.payment_method || "")
            setPaidAmount(Number(invoice.paid_amount) || 0)
            setDiscount(Number(invoice.discount) || 0)
            setTax(Number(invoice.tax) || 0)
            setNotes(invoice.notes || "")
            setTermsConditions(invoice.terms_conditions || "")

            // 3. Fetch invoice items
            const { data: invoiceItems, error: itemsError } = await supabase
                .from("invoice_items")
                .select("*")
                .eq("invoice_id", invoiceId)

            if (itemsError) {
                console.error("Error fetching invoice items:", itemsError)
            } else if (invoiceItems) {
                setItems(invoiceItems.map(item => ({
                    id: item.id,
                    item_name: item.item_name,
                    description: item.description || "",
                    category: item.category || "",
                    brand: item.brand || "",
                    model_code: item.model_code || "",
                    unit_price: Number(item.unit_price),
                    quantity: item.quantity,
                    line_total: Number(item.line_total),
                })))
            }

            setFetching(false)
        }
        fetchData()
    }, [supabase, invoiceId, router])

    useEffect(() => {
        if (newItem.category && newItem.category !== "custom") {
            const selectedCat = categories.find((c) => c.name === newItem.category)
            if (selectedCat) {
                setFilteredBrands(allBrands.filter((b) => b.category_id === selectedCat.id))
            } else {
                setFilteredBrands([])
            }
        } else {
            setFilteredBrands([])
        }

        if (newItem.category !== "custom" && !isCustomBrand) {
            setNewItem(prev => ({ ...prev, brand: "" }))
        }
    }, [newItem.category, categories, allBrands, isCustomBrand])

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0)
    const total = subtotal - discount + tax
    const remainingAmount = Math.max(0, total - paidAmount)

    const addItem = async () => {
        if (!newItem.item_name || !newItem.unit_price) {
            alert("Please enter both Item Name and Unit Price to add an item.")
            return
        }

        let finalCategory = newItem.category || ""
        let finalBrand = newItem.brand || ""

        if (isCustomCategory && customCategoryName) {
            const { data: newCat } = await supabase
                .from("product_categories")
                .insert({ name: customCategoryName })
                .select()
                .single()

            const { data: updatedCats } = await supabase.from("product_categories").select("*").order("name")
            if (updatedCats) setCategories(updatedCats)
            finalCategory = customCategoryName
        }

        if (isCustomBrand && customBrandName) {
            let catId = categories.find(c => c.name === finalCategory)?.id
            if (catId) {
                await supabase.from("product_brands").insert({ name: customBrandName, category_id: catId })
                const { data: updatedBrands } = await supabase.from("product_brands").select("*").order("name")
                if (updatedBrands) setAllBrands(updatedBrands)
            }
            finalBrand = customBrandName
        }

        const lineTotal = (newItem.unit_price || 0) * (newItem.quantity || 1)
        const item: LineItem = {
            id: crypto.randomUUID(),
            item_name: newItem.item_name || "",
            description: newItem.description || "",
            category: finalCategory,
            brand: finalBrand,
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
        setIsCustomCategory(false)
        setCustomCategoryName("")
        setIsCustomBrand(false)
        setCustomBrandName("")
    }

    const removeItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id))
    }

    const handleUpdate = async () => {
        if (!customerName || items.length === 0) {
            alert("Please enter customer name and add at least one item")
            return
        }

        setLoading(true)
        try {
            let paymentStatus: "pending" | "partial" | "paid" = "pending"
            if (paidAmount >= total) {
                paymentStatus = "paid"
            } else if (paidAmount > 0) {
                paymentStatus = "partial"
            }

            const { error: invoiceError } = await supabase
                .from("invoices")
                .update({
                    invoice_date: invoiceDate,
                    customer_name: customerName,
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
                    updated_at: new Date().toISOString()
                })
                .eq("id", invoiceId)

            if (invoiceError) throw invoiceError

            // Delete existing items and insert new ones
            await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId)

            const itemsToInsert = items.map((item) => ({
                invoice_id: invoiceId,
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

            router.push(`/invoices/${invoiceId}`)
            router.refresh()
        } catch (error) {
            console.error("Error updating invoice:", error)
            alert("Failed to update invoice: " + (error as Error).message)
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/invoices/${invoiceId}`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Edit Invoice</h1>
                        <p className="text-muted-foreground">Modify the details of invoice #{serialNumber ?? invoiceNumber}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/invoices/${invoiceId}`)}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpdate} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Update Invoice
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-foreground">Invoice Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Invoice Number</Label>
                                    <Input value={serialNumber ?? invoiceNumber} disabled className="bg-muted" />
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
                                <div className="col-span-2">
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

            {/* Add Item Form (Simplified for Edit) */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Update Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="col-span-2">
                            <Label>Item Name *</Label>
                            <Input
                                list="invoice-item-names"
                                placeholder="e.g., 8MP Camera"
                                value={newItem.item_name}
                                onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                            />
                            <datalist id="invoice-item-names">
                                {existingItemNames.map(name => <option key={name} value={name} />)}
                            </datalist>
                        </div>
                        <div>
                            <Label>Category</Label>
                            {!isCustomCategory ? (
                                <Select
                                    value={newItem.category}
                                    onValueChange={(val) => {
                                        if (val === "custom") {
                                            setIsCustomCategory(true)
                                            setNewItem(prev => ({ ...prev, category: "custom" }))
                                        } else {
                                            setNewItem(prev => ({ ...prev, category: val }))
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.name}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="custom" className="text-primary font-bold italic">Custom...</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="flex gap-1">
                                    <Input
                                        placeholder="New cat"
                                        value={customCategoryName}
                                        onChange={e => setCustomCategoryName(e.target.value)}
                                        className="h-9"
                                    />
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsCustomCategory(false)}>
                                        <Plus className="h-4 w-4 rotate-45" />
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div>
                            <Label>Brand</Label>
                            {!isCustomBrand ? (
                                <Select
                                    value={newItem.brand}
                                    onValueChange={(val) => {
                                        if (val === "custom") {
                                            setIsCustomBrand(true)
                                            setNewItem(prev => ({ ...prev, brand: "custom" }))
                                        } else {
                                            setNewItem(prev => ({ ...prev, brand: val }))
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredBrands.length > 0 ? (
                                            filteredBrands.map((brand) => (
                                                <SelectItem key={brand.id} value={brand.name}>
                                                    {brand.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            !isCustomCategory && <SelectItem value="none" disabled>No brands</SelectItem>
                                        )}
                                        <SelectItem value="custom" className="text-primary font-bold italic">Custom...</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="flex gap-1">
                                    <Input
                                        placeholder="New brand"
                                        value={customBrandName}
                                        onChange={e => setCustomBrandName(e.target.value)}
                                        className="h-9"
                                    />
                                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsCustomBrand(false)}>
                                        <Plus className="h-4 w-4 rotate-45" />
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div>
                            <Label>Model</Label>
                            <Input
                                placeholder="Model"
                                value={newItem.model_code}
                                onChange={(e) => setNewItem({ ...newItem, model_code: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Unit Price</Label>
                            <Input
                                type="number"
                                value={newItem.unit_price || ""}
                                onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label>Qty</Label>
                            <Input
                                type="number"
                                value={newItem.quantity || 1}
                                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) || 1 })}
                            />
                        </div>
                    </div>
                    <Button onClick={addItem} className="mt-4">
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <div className="font-medium">{item.item_name}</div>
                                    <div className="text-xs text-muted-foreground">{item.category} | {item.brand}</div>
                                </TableCell>
                                <TableCell>PKR {item.unit_price.toLocaleString()}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell className="font-bold">PKR {item.line_total.toLocaleString()}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Payment & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Payment Method</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Paid Amount</Label>
                                <Input
                                    type="number"
                                    value={paidAmount || ""}
                                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label>Discount</Label>
                                <Input
                                    type="number"
                                    value={discount || ""}
                                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label>Tax</Label>
                                <Input
                                    type="number"
                                    value={tax || ""}
                                    onChange={(e) => setTax(Number(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Internal notes..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>PKR {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-red-500 font-medium">
                            <span>Discount (-Code)</span>
                            <span>- PKR {discount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax</span>
                            <span>PKR {tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Total</span>
                            <span>PKR {total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                            <span>Paid Amount</span>
                            <span>PKR {paidAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-red-600 font-bold border-t pt-2">
                            <span>Remaining</span>
                            <span>PKR {remainingAmount.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
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
    )
}
