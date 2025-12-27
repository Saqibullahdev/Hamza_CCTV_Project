"use client"

import { useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Camera, Store, Phone, Calendar, Hash, Download, Share2, CreditCard } from "lucide-react"
import type { PurchasedItem, QRData } from "@/lib/types"

interface ViewPurchaseDialogProps {
  purchase: PurchasedItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewPurchaseDialog({ purchase, open, onOpenChange }: ViewPurchaseDialogProps) {
  const qrRef = useRef<HTMLDivElement>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const qrData: QRData = {
    id: purchase.id,
    serial_numbers: purchase.serial_numbers,
    shop_name: purchase.shops?.shop_name || "Unknown",
    date: purchase.purchase_date,
    category: purchase.category,
    item_type: purchase.product_name || purchase.item_type,
    product_name: purchase.product_name,
    brand: purchase.brand,
    model_code: purchase.model_code,
    total_amount: purchase.unit_price * purchase.quantity,
  }

  const handleDownloadQR = () => {
    if (!qrRef.current) return

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
      downloadLink.download = `qr-${purchase.product_name || purchase.item_type}-${purchase.id.slice(0, 8)}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.crossOrigin = "anonymous"
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handleShareWhatsApp = () => {
    const message = `*Purchase Receipt*\n\nProduct: ${purchase.product_name || purchase.item_type}\nBrand: ${purchase.brand || "N/A"}\nCategory: ${purchase.category}\nModel: ${purchase.model_code || "N/A"}\nQuantity: ${purchase.quantity}\nTotal: ${formatCurrency(purchase.unit_price * purchase.quantity)}\nDate: ${purchase.purchase_date}\nShop: ${purchase.shops?.shop_name || "Unknown"}\n\nSerial Numbers:\n${purchase.serial_numbers.join("\n")}`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const totalAmount = purchase.unit_price * purchase.quantity

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Purchase Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col items-center space-y-3 p-4 rounded-lg border border-border bg-muted/30">
            <div ref={qrRef} className="bg-white p-3 rounded-lg">
              <QRCodeSVG value={JSON.stringify(qrData)} size={140} level="M" includeMargin />
            </div>
            <div className="flex gap-2 w-full max-w-xs">
              <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={handleDownloadQR}>
                <Download className="mr-1 h-3 w-3" />
                Download
              </Button>
              <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={handleShareWhatsApp}>
                <Share2 className="mr-1 h-3 w-3" />
                WhatsApp
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="mb-3 font-semibold text-foreground">Product Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-medium">{purchase.product_name || purchase.item_type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category:</span>
                <Badge variant="secondary">{purchase.category}</Badge>
              </div>
              {purchase.brand && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Brand:</span>
                  <span className="font-medium">{purchase.brand}</span>
                </div>
              )}
              {purchase.model_code && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Model/Code:</span>
                  <span className="font-mono font-medium">{purchase.model_code}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{purchase.quantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Unit Price:</span>
                <span className="font-medium">{formatCurrency(purchase.unit_price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold text-primary">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Purchase Date:</span>
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="h-3 w-3" />
                  {new Date(purchase.purchase_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {purchase.payment_method && (
            <>
              <Separator />
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-3 font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-medium">{purchase.payment_method}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Paid Amount:</span>
                    <span className="font-medium text-green-600">{formatCurrency(purchase.paid_amount || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span
                      className={`font-semibold ${(purchase.remaining_amount || 0) > 0 ? "text-destructive" : "text-green-600"}`}
                    >
                      {formatCurrency(purchase.remaining_amount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="rounded-lg border border-border p-4">
            <h3 className="mb-3 font-semibold text-foreground flex items-center gap-2">
              <Store className="h-4 w-4" />
              Shop Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Shop Name:</span>
                <span className="font-medium">{purchase.shops?.shop_name || "Unknown"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Mobile:</span>
                <span className="flex items-center gap-1 font-medium">
                  <Phone className="h-3 w-3" />
                  {purchase.shops?.mob_no || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="rounded-lg border border-border p-4">
            <h3 className="mb-3 font-semibold text-foreground flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Serial Numbers ({purchase.serial_numbers.length})
            </h3>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {purchase.serial_numbers.map((sn, index) => (
                <div key={index} className="rounded bg-muted px-2 py-1 font-mono text-sm">
                  {sn}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
