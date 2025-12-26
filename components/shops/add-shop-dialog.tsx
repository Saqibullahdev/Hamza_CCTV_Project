"use client"

import type React from "react"

import { useState } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, CheckCircle2 } from "lucide-react"

export function AddShopDialog() {
  const [open, setOpen] = useState(false)
  const [shopName, setShopName] = useState("")
  const [mobNo, setMobNo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from("shops").insert({
      shop_name: shopName,
      mob_no: mobNo,
    })

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    setIsSuccess(true)
    setIsLoading(false)
    setShopName("")
    setMobNo("")

    // Refresh and close after a short delay to show success
    setTimeout(() => {
      setIsSuccess(false)
      setOpen(false)
      router.refresh()
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Shop
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Shop</DialogTitle>
          <DialogDescription>Add a new vendor/shop to your ledger</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 animate-in zoom-in duration-300" />
              <p className="text-lg font-semibold text-foreground">Shop Added Successfully!</p>
              <p className="text-sm text-muted-foreground text-center">
                The new shop has been added to your ledger.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name</Label>
                <Input
                  id="shopName"
                  placeholder="Enter shop name"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobNo">Mobile Number</Label>
                <Input
                  id="mobNo"
                  placeholder="Enter mobile number"
                  value={mobNo}
                  onChange={(e) => setMobNo(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
          <DialogFooter>
            {!isSuccess && (
              <>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Shop"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
