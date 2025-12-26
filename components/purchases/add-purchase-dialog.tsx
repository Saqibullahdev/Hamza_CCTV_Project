"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Plus, ChevronDown, Download, Share2, Check, Loader2 } from "lucide-react"
import type { Shop, QRData } from "@/lib/types"

interface AddPurchaseDialogProps {
  shops: Shop[]
}

const PRODUCT_CATEGORIES = ["Camera", "DVR", "NVR", "Cable", "Power Supply", "Accessory", "Hard Disk", "Other"]
const BRANDS = ["Hikvision", "Dahua", "CP Plus", "Uniview", "Samsung", "Honeywell", "Bosch", "Other"]
const PAYMENT_METHODS = ["Cash", "Bank Transfer", "JazzCash", "EasyPaisa", "Credit"]

export function AddPurchaseDialog({ shops }: AddPurchaseDialogProps) {
  const [open, setOpen] = useState(false)
  // Basic fields
  const [shopId, setShopId] = useState("")
  const [serialNumbers, setSerialNumbers] = useState("")
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0])

  const [productName, setProductName] = useState("")
  const [category, setCategory] = useState("")
  const [brand, setBrand] = useState("")
  const [modelCode, setModelCode] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")

  const [showPaymentDetails, setShowPaymentDetails] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paidAmount, setPaidAmount] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [createdPurchase, setCreatedPurchase] = useState<{ id: string; qrData: QRData } | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  const router = useRouter()

  const totalPrice = (Number.parseFloat(unitPrice) || 0) * (Number.parseInt(quantity) || 0)
  const remainingAmount = totalPrice - (Number.parseFloat(paidAmount) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const serialNumbersArray = serialNumbers
      .split("\n")
      .map((sn) => sn.trim())
      .filter((sn) => sn.length > 0)

    if (serialNumbersArray.length === 0) {
      setError("Please enter at least one serial number")
      setIsLoading(false)
      return
    }

    const selectedShop = shops.find((s) => s.id === shopId)

    const qrData: QRData = {
      id: "", // Will be set after insert
      serial_numbers: serialNumbersArray,
      shop_name: selectedShop?.shop_name || "Unknown",
      date: purchaseDate,
      category,
      camera_type: productName,
      product_name: productName,
      brand,
      model_code: modelCode,
      total_amount: totalPrice,
    }

    const supabase = createClient()
    const { data: insertedData, error: insertError } = await supabase
      .from("purchased_cameras")
      .insert({
        shop_id: shopId,
        serial_numbers: serialNumbersArray,
        camera_type: productName,
        category,
        unit_price: Number.parseFloat(unitPrice),
        quantity: Number.parseInt(quantity),
        purchase_date: purchaseDate,
        product_name: productName,
        brand,
        model_code: modelCode,
        payment_method: paymentMethod || null,
        paid_amount: Number.parseFloat(paidAmount) || 0,
        remaining_amount: remainingAmount > 0 ? remainingAmount : 0,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    qrData.id = insertedData.id

    await supabase
      .from("purchased_cameras")
      .update({
        qr_code_data: qrData,
      })
      .eq("id", insertedData.id)

    setCreatedPurchase({ id: insertedData.id, qrData })
    setIsLoading(false)
  }

  const handleDownloadQR = () => {
    if (!qrRef.current || !createdPurchase) return

    const svg = qrRef.current.querySelector("svg")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.download = `qr-${productName}-${createdPurchase.id.slice(0, 8)}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.crossOrigin = "anonymous"
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handleShareWhatsApp = () => {
    if (!createdPurchase) return

    const message = `*Purchase Receipt*\n\nProduct: ${productName}\nBrand: ${brand}\nCategory: ${category}\nModel: ${modelCode}\nQuantity: ${quantity}\nTotal: Rs ${totalPrice.toLocaleString()}\nDate: ${purchaseDate}\n\nSerial Numbers:\n${serialNumbers}`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleClose = () => {
    // Reset all form fields
    setShopId("")
    setSerialNumbers("")
    setProductName("")
    setCategory("")
    setBrand("")
    setModelCode("")
    setQuantity("")
    setUnitPrice("")
    setPurchaseDate(new Date().toISOString().split("T")[0])
    setPaymentMethod("")
    setPaidAmount("")
    setShowPaymentDetails(false)
    setCreatedPurchase(null)
    setError(null)
    setOpen(false)
    router.refresh()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose()
        else setOpen(true)
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Purchase
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{createdPurchase ? "Purchase Created!" : "Add New Purchase"}</DialogTitle>
          <DialogDescription>
            {createdPurchase
              ? "Your purchase has been recorded. Download or share the QR code."
              : "Record a new product purchase entry"}
          </DialogDescription>
        </DialogHeader>

        {createdPurchase ? (
          <div className="flex flex-col items-center space-y-4 py-4">
            <div ref={qrRef} className="rounded-lg border border-border bg-white p-4">
              <QRCodeSVG value={JSON.stringify(createdPurchase.qrData)} size={200} level="M" includeMargin />
            </div>
            <div className="text-center">
              <p className="font-medium">{productName}</p>
              <p className="text-sm text-muted-foreground">
                {brand} - {category}
              </p>
              <p className="text-sm font-semibold text-primary">{formatCurrency(totalPrice)}</p>
            </div>
            <div className="flex gap-2 w-full max-w-xs">
              <Button onClick={handleDownloadQR} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button onClick={handleShareWhatsApp} variant="outline" className="flex-1 bg-transparent">
                <Share2 className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
            </div>
            <Button variant="ghost" onClick={handleClose} className="w-full max-w-xs">
              <Check className="mr-2 h-4 w-4" />
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4 pr-2">
              {/* Shop Selection */}
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
                <h4 className="font-medium text-sm">Product Details</h4>

                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    placeholder="e.g., 8MP Camera, DVR 8 Channel"
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
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Select value={brand} onValueChange={setBrand} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANDS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelCode">Model / Code</Label>
                  <Input
                    id="modelCode"
                    placeholder="e.g., DS-2CD2385G1-I"
                    value={modelCode}
                    onChange={(e) => setModelCode(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price (Rs)</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Total Price Display */}
                {totalPrice > 0 && (
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Price:</span>
                      <span className="text-lg font-semibold text-primary">{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Serial Numbers */}
              <div className="space-y-2">
                <Label htmlFor="serialNumbers">Serial Numbers (one per line)</Label>
                <Textarea
                  id="serialNumbers"
                  placeholder="Enter serial numbers, one per line"
                  value={serialNumbers}
                  onChange={(e) => setSerialNumbers(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              {/* Purchase Date */}
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                />
              </div>

              <Collapsible open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" className="w-full justify-between">
                    <span className="text-sm">Payment Details (Optional)</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showPaymentDetails ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
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

                  <div className="space-y-2">
                    <Label htmlFor="paidAmount">Paid Amount (Rs)</Label>
                    <Input
                      id="paidAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                    />
                  </div>

                  {totalPrice > 0 && (
                    <div className="rounded-lg border border-border p-3 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span>{formatCurrency(totalPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Paid Amount:</span>
                        <span>{formatCurrency(Number.parseFloat(paidAmount) || 0)}</span>
                      </div>
                      <Separator className="my-1" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Remaining:</span>
                        <span
                          className={`font-semibold ${remainingAmount > 0 ? "text-destructive" : "text-green-600"}`}
                        >
                          {formatCurrency(remainingAmount > 0 ? remainingAmount : 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !shopId}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Purchase"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
