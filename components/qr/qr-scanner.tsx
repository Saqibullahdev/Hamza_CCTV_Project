"use client"

import type React from "react"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ScanLine, Camera, Store, Phone, Calendar, Hash, X, Loader2, ImageIcon, Download, Share2 } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import type { PurchasedItem, QRData } from "@/lib/types"

function ScanResultSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <Skeleton className="h-5 w-32 mb-3" />
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <Skeleton className="h-5 w-28 mb-3" />
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function QRCodeScanner() {
  const [scannedData, setScannedData] = useState<QRData | null>(null)
  const [purchaseDetails, setPurchaseDetails] = useState<PurchasedItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qrDisplayRef = useRef<HTMLDivElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)
    setScannedData(null)
    setPurchaseDetails(null)

    const previewUrl = URL.createObjectURL(file)
    setPreviewImage(previewUrl)

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"

      const reader = new FileReader()
      reader.onerror = () => {
        setError("Failed to read the image file. Please try again.")
        setIsLoading(false)
      }
      reader.onload = async (event) => {
        img.onerror = () => {
          setError("Failed to load the image. Please try a different format.")
          setIsLoading(false)
        }
        img.onload = async () => {
          try {
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")
            canvas.width = img.width
            canvas.height = img.height
            ctx?.drawImage(img, 0, 0)

            const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
            if (imageData) {
              const jsQR = (await import("jsqr")).default
              const code = jsQR(imageData.data, imageData.width, imageData.height)

              if (code) {
                await processQRData(code.data)
              } else {
                setError("Could not detect QR code in the image. Please try a clearer image.")
                setIsLoading(false)
              }
            } else {
              setError("Failed to process image data.")
              setIsLoading(false)
            }
          } catch (err) {
            setError("Error processing QR code. Please try again.")
            setIsLoading(false)
          }
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    } catch {
      setError("Failed to process image")
      setIsLoading(false)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const input = fileInputRef.current
      if (input) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        input.files = dataTransfer.files
        input.dispatchEvent(new Event("change", { bubbles: true }))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const processQRData = async (data: string) => {
    try {
      const parsed: QRData = JSON.parse(data)
      setScannedData(parsed)

      const supabase = createClient()
      const { data: purchase } = await supabase
        .from("purchased_items")
        .select("*, shops(*)")
        .eq("id", parsed.id)
        .single()

      if (purchase) {
        setPurchaseDetails(purchase)
      }
      setIsLoading(false)
    } catch {
      setError("Invalid QR code data format")
      setIsLoading(false)
    }
  }

  const handleManualInput = async () => {
    if (!manualInput.trim()) return

    setIsLoading(true)
    setError(null)
    setPreviewImage(null)

    try {
      await processQRData(manualInput)
    } catch {
      setError("Invalid QR data format")
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setScannedData(null)
    setPurchaseDetails(null)
    setError(null)
    setManualInput("")
    setPreviewImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDownloadQR = () => {
    if (!qrDisplayRef.current || !scannedData) return

    const svg = qrDisplayRef.current.querySelector("svg")
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
      downloadLink.download = `qr-${scannedData.camera_type}-${scannedData.id.slice(0, 8)}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.crossOrigin = "anonymous"
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handleShareWhatsApp = () => {
    if (!purchaseDetails) return

    const message = `*Purchase Details*\n\nProduct: ${purchaseDetails.product_name || purchaseDetails.camera_type}\nBrand: ${purchaseDetails.brand || "N/A"}\nCategory: ${purchaseDetails.category}\nModel: ${purchaseDetails.model_code || "N/A"}\nQuantity: ${purchaseDetails.quantity}\nTotal: Rs ${(purchaseDetails.unit_price * purchaseDetails.quantity).toLocaleString()}\nDate: ${purchaseDetails.purchase_date}\nShop: ${purchaseDetails.shops?.shop_name || "Unknown"}\n\nSerial Numbers:\n${purchaseDetails.serial_numbers.join("\n")}`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Scan QR Code
          </CardTitle>
          <CardDescription>Upload a QR code image or paste the QR data to look up purchase details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="qr-upload"
            />
            {previewImage ? (
              <div className="space-y-2">
                <img src={previewImage || "/placeholder.svg"} alt="Uploaded QR" className="max-h-32 mx-auto rounded" />
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Processing..." : "Click to upload a different image"}
                </p>
              </div>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
              </>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or paste data</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Paste QR JSON data..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
            />
            <Button onClick={handleManualInput} disabled={isLoading || !manualInput.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Decode"}
            </Button>
          </div>

          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          {(scannedData || purchaseDetails) && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleClear}>
                <X className="mr-2 h-4 w-4" />
                Clear Results
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading && !error && <ScanResultSkeleton />}

      {purchaseDetails && !isLoading && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {purchaseDetails.product_name || purchaseDetails.camera_type}
              </CardTitle>
              <Badge variant="secondary">{purchaseDetails.category}</Badge>
            </div>
            <CardDescription>Scanned purchase details from QR code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-3 font-semibold text-foreground flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Product Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Product:</span>
                    <span className="font-medium">{purchaseDetails.product_name || purchaseDetails.camera_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{purchaseDetails.category}</span>
                  </div>
                  {purchaseDetails.brand && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Brand:</span>
                      <span className="font-medium">{purchaseDetails.brand}</span>
                    </div>
                  )}
                  {purchaseDetails.model_code && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-mono font-medium">{purchaseDetails.model_code}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="font-medium">{purchaseDetails.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Unit Price:</span>
                    <span className="font-medium">{formatCurrency(purchaseDetails.unit_price)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Value:</span>
                    <span className="font-semibold text-primary">
                      {formatCurrency(purchaseDetails.unit_price * purchaseDetails.quantity)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Purchase Date:</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="h-3 w-3" />
                      {new Date(purchaseDetails.purchase_date).toLocaleDateString()}
                    </span>
                  </div>
                  {purchaseDetails.payment_method && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Payment:</span>
                        <span className="font-medium">{purchaseDetails.payment_method}</span>
                      </div>
                      {(purchaseDetails.remaining_amount ?? 0) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Remaining:</span>
                          <span className="font-medium text-destructive">
                            {formatCurrency(purchaseDetails.remaining_amount ?? 0)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-3 font-semibold text-foreground flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Shop Details (Ledger)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Shop Name:</span>
                    <span className="font-medium">{purchaseDetails.shops?.shop_name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mobile Number:</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Phone className="h-3 w-3" />
                      {purchaseDetails.shops?.mob_no || "N/A"}
                    </span>
                  </div>
                </div>

                {scannedData && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div ref={qrDisplayRef} className="flex justify-center mb-3">
                      <div className="bg-white p-2 rounded">
                        <QRCodeSVG value={JSON.stringify(scannedData)} size={100} level="M" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={handleDownloadQR}>
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={handleShareWhatsApp}
                      >
                        <Share2 className="mr-1 h-3 w-3" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-3 font-semibold text-foreground flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Serial Numbers ({purchaseDetails.serial_numbers.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {purchaseDetails.serial_numbers.map((sn, index) => (
                  <Badge key={index} variant="outline" className="font-mono">
                    {sn}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
