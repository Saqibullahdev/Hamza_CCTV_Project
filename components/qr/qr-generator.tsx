"use client"

import { useState, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { QrCode, Download } from "lucide-react"
import type { PurchasedItem } from "@/lib/types"

interface QRCodeGeneratorProps {
  purchases: PurchasedItem[]
}

interface QRData {
  id: string
  serial_numbers: string[]
  shop_name: string
  date: string
  category: string
  item_type: string
}

export function QRCodeGenerator({ purchases }: QRCodeGeneratorProps) {
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>("")
  const qrRef = useRef<HTMLDivElement>(null)

  const selectedPurchase = purchases.find((p) => p.id === selectedPurchaseId)

  const qrData: QRData | null = selectedPurchase
    ? {
      id: selectedPurchase.id,
      serial_numbers: selectedPurchase.serial_numbers,
      shop_name: selectedPurchase.shops?.shop_name || "Unknown",
      date: selectedPurchase.purchase_date,
      category: selectedPurchase.category,
      item_type: selectedPurchase.item_type,
    }
    : null

  const handleDownload = () => {
    if (!qrRef.current || !selectedPurchase) return

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
      downloadLink.download = `qr-${selectedPurchase.item_type}-${selectedPurchase.id.slice(0, 8)}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.crossOrigin = "anonymous"
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generate QR Code
          </CardTitle>
          <CardDescription>Select a purchase to generate a QR code containing all details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedPurchaseId} onValueChange={setSelectedPurchaseId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a purchase" />
            </SelectTrigger>
            <SelectContent>
              {purchases.map((purchase) => (
                <SelectItem key={purchase.id} value={purchase.id}>
                  {purchase.item_type} - {purchase.category} ({new Date(purchase.purchase_date).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPurchase && (
            <div className="rounded-lg border border-border p-4">
              <h4 className="mb-3 font-semibold">Purchase Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Item Type:</span>
                  <span className="font-medium">{selectedPurchase.item_type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <Badge variant="secondary">{selectedPurchase.category}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shop:</span>
                  <span className="font-medium">{selectedPurchase.shops?.shop_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{new Date(selectedPurchase.purchase_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Serial Numbers:</span>
                  <span className="font-medium">{selectedPurchase.serial_numbers.length}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR Code Preview</CardTitle>
          <CardDescription>
            {selectedPurchase ? "Scan this code to view purchase details" : "Select a purchase to generate QR code"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          {qrData ? (
            <>
              <div ref={qrRef} className="rounded-lg border border-border bg-white p-4">
                <QRCodeSVG value={JSON.stringify(qrData)} size={200} level="M" includeMargin />
              </div>
              <Button onClick={handleDownload} className="w-full max-w-xs">
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </>
          ) : (
            <div className="flex h-[248px] w-[248px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
              <p className="text-center text-sm text-muted-foreground">QR code will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
