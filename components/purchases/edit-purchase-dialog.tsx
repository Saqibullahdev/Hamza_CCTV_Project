"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Loader2, Save } from "lucide-react"
import type { Shop, PurchasedItem } from "@/lib/types"

interface EditPurchaseDialogProps {
    purchase: PurchasedItem
    shops: Shop[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "JazzCash", "EasyPaisa", "Credit"]

export function EditPurchaseDialog({ purchase, shops, open, onOpenChange }: EditPurchaseDialogProps) {
    const [shopId, setShopId] = useState(purchase.shop_id)
    const [serialNumbers, setSerialNumbers] = useState(purchase.serial_numbers.join("\n"))
    const [purchaseDate, setPurchaseDate] = useState(purchase.purchase_date)
    const [productName, setProductName] = useState(purchase.product_name || purchase.item_type)
    const [category, setCategory] = useState(purchase.category)
    const [brand, setBrand] = useState(purchase.brand || "")
    const [modelCode, setModelCode] = useState(purchase.model_code || "")
    const [quantity, setQuantity] = useState(purchase.quantity.toString())
    const [unitPrice, setUnitPrice] = useState(purchase.unit_price.toString())
    const [paymentMethod, setPaymentMethod] = useState(purchase.payment_method || "")
    const [paidAmount, setPaidAmount] = useState(purchase.paid_amount?.toString() || "0")
    const [discount, setDiscount] = useState((purchase as any).discount?.toString() || "0")

    const [showPaymentDetails, setShowPaymentDetails] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Dynamic data for selects (reusing same logic)
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
    const [allBrands, setAllBrands] = useState<{ id: string; name: string; category_id: string }[]>([])

    useEffect(() => {
        if (open) {
            const fetchData = async () => {
                const [{ data: cats }, { data: brands }] = await Promise.all([
                    supabase.from("product_categories").select("*").order("name"),
                    supabase.from("product_brands").select("*").order("name"),
                ])
                if (cats) setCategories(cats)
                if (brands) setAllBrands(brands)
            }
            fetchData()
        }
    }, [open, supabase])

    const subtotal = (Number.parseFloat(unitPrice) || 0) * (Number.parseInt(quantity) || 0)
    const totalPrice = Math.max(0, subtotal - (Number.parseFloat(discount) || 0))
    const remainingAmount = totalPrice - (Number.parseFloat(paidAmount) || 0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const serialNumbersArray = serialNumbers
            .split("\n")
            .map((sn) => sn.trim())
            .filter((sn) => sn.length > 0)

        try {
            const { error: updateError } = await supabase
                .from("purchased_items")
                .update({
                    shop_id: shopId,
                    serial_numbers: serialNumbersArray,
                    item_type: productName,
                    category: category,
                    unit_price: Number.parseFloat(unitPrice),
                    quantity: Number.parseInt(quantity),
                    purchase_date: purchaseDate,
                    product_name: productName,
                    brand: brand,
                    model_code: modelCode,
                    payment_method: paymentMethod || null,
                    paid_amount: Number.parseFloat(paidAmount) || 0,
                    discount: Number.parseFloat(discount) || 0,
                    remaining_amount: remainingAmount > 0 ? remainingAmount : 0,
                    updated_at: new Date().toISOString()
                })
                .eq("id", purchase.id)

            if (updateError) throw updateError

            onOpenChange(false)
            router.refresh()
        } catch (err: any) {
            alert("Failed to update purchase: " + err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Purchase</DialogTitle>
                    <DialogDescription>Update purchase entry details</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4 pr-2">
                        <div className="space-y-2">
                            <Label htmlFor="shop">Shop / Vendor</Label>
                            <Select value={shopId} onValueChange={setShopId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a shop" />
                                </SelectTrigger>
                                <SelectContent>
                                    {shops.map((shop) => (
                                        <SelectItem key={shop.id} value={shop.id}>
                                            {shop.shop_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="productName">Product Name</Label>
                                <Input
                                    id="productName"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select value={category} onValueChange={setCategory} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.name}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="brand">Brand</Label>
                                    <Input value={brand} onChange={e => setBrand(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unitPrice">Unit Price (Rs)</Label>
                                    <Input
                                        type="number"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="serialNumbers">Serial Numbers (one per line)</Label>
                            <Textarea
                                value={serialNumbers}
                                onChange={(e) => setSerialNumbers(e.target.value)}
                                rows={3}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="purchaseDate">Purchase Date</Label>
                            <Input
                                type="date"
                                value={purchaseDate}
                                onChange={(e) => setPurchaseDate(e.target.value)}
                                required
                            />
                        </div>

                        <Collapsible open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
                            <CollapsibleTrigger asChild>
                                <Button type="button" variant="ghost" className="w-full justify-between">
                                    <span className="text-sm">Payment Details</span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showPaymentDetails ? "rotate-180" : ""}`} />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-3 pt-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
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
                                    <div className="space-y-2">
                                        <Label>Paid Amount (Rs)</Label>
                                        <Input
                                            type="number"
                                            value={paidAmount}
                                            onChange={(e) => setPaidAmount(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Discount (Rs)</Label>
                                        <Input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>Rs {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-red-500">
                                        <span>Discount:</span>
                                        <span>-Rs {Number(discount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-bold">
                                        <span>Total:</span>
                                        <span>Rs {totalPrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-destructive">
                                        <span>Remaining:</span>
                                        <span>Rs {remainingAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Update Purchase
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
