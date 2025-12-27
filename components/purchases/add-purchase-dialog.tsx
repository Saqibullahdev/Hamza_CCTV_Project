"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
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
import { Plus, ChevronDown, Download, Share2, Check, Loader2, CheckCircle2 } from "lucide-react"
import type { Shop, QRData } from "@/lib/types"

interface AddPurchaseDialogProps {
  shops: Shop[]
}

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

  // Dynamic data state
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [allBrands, setAllBrands] = useState<{ id: string; name: string; category_id: string }[]>([])
  const [existingProductNames, setExistingProductNames] = useState<string[]>([])
  const [filteredBrands, setFilteredBrands] = useState<{ id: string; name: string }[]>([])

  // Custom entry state
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customCategoryName, setCustomCategoryName] = useState("")
  const [isCustomBrand, setIsCustomBrand] = useState(false)
  const [customBrandName, setCustomBrandName] = useState("")

  const [showPaymentDetails, setShowPaymentDetails] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paidAmount, setPaidAmount] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [createdPurchase, setCreatedPurchase] = useState<{ id: string; qrData: QRData } | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: cats }, { data: brands }, { data: products }] = await Promise.all([
        supabase.from("product_categories").select("*").order("name"),
        supabase.from("product_brands").select("*").order("name"),
        supabase.from("purchased_items").select("product_name"),
      ])

      if (cats) setCategories(cats)
      if (brands) setAllBrands(brands)
      if (products) {
        const uniqueProducts = Array.from(new Set(products.map((p) => p.product_name).filter(Boolean)))
        setExistingProductNames(uniqueProducts)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open, supabase])

  useEffect(() => {
    if (category && category !== "custom") {
      const selectedCat = categories.find((c) => c.name === category)
      if (selectedCat) {
        setFilteredBrands(allBrands.filter((b) => b.category_id === selectedCat.id))
      } else {
        setFilteredBrands([])
      }
    } else {
      setFilteredBrands([])
    }
    // Only reset brand if it's not custom and category changed
    if (category !== "custom" && !isCustomBrand) {
      setBrand("")
    }
  }, [category, categories, allBrands, isCustomBrand])

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

    try {
      let finalCategory = category
      let finalBrand = brand

      // Handle custom category
      if (isCustomCategory && customCategoryName) {
        const { data: newCat, error: catError } = await supabase
          .from("product_categories")
          .insert({ name: customCategoryName })
          .select()
          .single()

        if (catError && catError.code !== "23505") { // Ignore unique violation
          throw new Error("Failed to save custom category: " + catError.message)
        }
        finalCategory = customCategoryName
      }

      // Handle custom brand
      if (isCustomBrand && customBrandName) {
        // Need to find category ID first
        let catId = categories.find((c) => c.name === finalCategory)?.id

        // If it was a new category, we need to fetch it to get the ID
        if (!catId) {
          const { data: fetchedCat } = await supabase.from("product_categories").select("id").eq("name", finalCategory).single()
          catId = fetchedCat?.id
        }

        if (catId) {
          const { error: brandError } = await supabase
            .from("product_brands")
            .insert({ name: customBrandName, category_id: catId })

          if (brandError && brandError.code !== "23505") { // Ignore unique violation
            throw new Error("Failed to save custom brand: " + brandError.message)
          }
        }
        finalBrand = customBrandName
      }

      const selectedShop = shops.find((s) => s.id === shopId)

      const qrData: QRData = {
        id: "", // Will be set after insert
        serial_numbers: serialNumbersArray,
        shop_name: selectedShop?.shop_name || "Unknown",
        date: purchaseDate,
        category: finalCategory,
        item_type: productName,
        product_name: productName,
        brand: finalBrand,
        model_code: modelCode,
        total_amount: totalPrice,
      }

      const { data: insertedData, error: insertError } = await supabase
        .from("purchased_items")
        .insert({
          shop_id: shopId,
          serial_numbers: serialNumbersArray,
          item_type: productName,
          category: finalCategory,
          unit_price: Number.parseFloat(unitPrice),
          quantity: Number.parseInt(quantity),
          purchase_date: purchaseDate,
          product_name: productName,
          brand: finalBrand,
          model_code: modelCode,
          payment_method: paymentMethod || null,
          paid_amount: Number.parseFloat(paidAmount) || 0,
          remaining_amount: remainingAmount > 0 ? remainingAmount : 0,
        })
        .select()
        .single()

      if (insertError) throw insertError

      qrData.id = insertedData.id

      await supabase
        .from("purchased_items")
        .update({
          qr_code_data: qrData,
        })
        .eq("id", insertedData.id)

      setCreatedPurchase({ id: insertedData.id, qrData })
      setIsLoading(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      alert(err.message || "An unexpected error occurred")
      setIsLoading(false)
    }
  }

  const handleValidationAndSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const missingFields = []
    if (!shopId) missingFields.push("Shop / Vendor")
    if (!productName) missingFields.push("Product Name")
    if (!category || (category === "custom" && !customCategoryName)) missingFields.push("Category")
    if (!brand || (brand === "custom" && !customBrandName)) missingFields.push("Brand")
    if (!quantity) missingFields.push("Quantity")
    if (!unitPrice) missingFields.push("Unit Price")
    if (!serialNumbers.trim()) missingFields.push("Serial Numbers")

    if (missingFields.length > 0) {
      const msg = `Please fill in the following mandatory fields:\n- ${missingFields.join("\n- ")}`
      setError(msg)
      alert(msg)
      return
    }

    handleSubmit(e)
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
    setIsCustomCategory(false)
    setCustomCategoryName("")
    setIsCustomBrand(false)
    setCustomBrandName("")
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
          <DialogTitle className="flex items-center gap-2">
            {createdPurchase ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Purchase Added Successfully!
              </>
            ) : "Add New Purchase"}
          </DialogTitle>
          <DialogDescription>
            {createdPurchase
              ? "The purchase has been recorded. You can share the receipt or download the QR code."
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
                {(isCustomBrand ? customBrandName : brand)} - {(isCustomCategory ? customCategoryName : category)}
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
          <form onSubmit={handleValidationAndSubmit}>
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
                    list="product-names"
                    placeholder="e.g., 8MP Camera, DVR 8 Channel"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                  <datalist id="product-names">
                    {existingProductNames.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    {!isCustomCategory ? (
                      <Select
                        value={category}
                        onValueChange={(val) => {
                          if (val === "custom") {
                            setIsCustomCategory(true)
                            setCategory("custom")
                          } else {
                            setCategory(val)
                          }
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
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
                      <div className="flex gap-2">
                        <Input
                          placeholder="New category"
                          value={customCategoryName}
                          onChange={(e) => setCustomCategoryName(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsCustomCategory(false)
                            setCategory("")
                          }}
                        >
                          <Plus className="h-4 w-4 rotate-45" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    {!isCustomBrand ? (
                      <Select
                        value={brand}
                        onValueChange={(val) => {
                          if (val === "custom") {
                            setIsCustomBrand(true)
                            setBrand("custom")
                          } else {
                            setBrand(val)
                          }
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredBrands.length > 0 ? (
                            filteredBrands.map((b) => (
                              <SelectItem key={b.id} value={b.name}>
                                {b.name}
                              </SelectItem>
                            ))
                          ) : (
                            !isCustomCategory && <SelectItem value="none" disabled>No brands for this category</SelectItem>
                          )}
                          <SelectItem value="custom" className="text-primary font-bold italic">Custom...</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="New brand"
                          value={customBrandName}
                          onChange={(e) => setCustomBrandName(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsCustomBrand(false)
                            setBrand("")
                          }}
                        >
                          <Plus className="h-4 w-4 rotate-45" />
                        </Button>
                      </div>
                    )}
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
              <Button type="submit" disabled={isLoading} className="cursor-pointer">
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
