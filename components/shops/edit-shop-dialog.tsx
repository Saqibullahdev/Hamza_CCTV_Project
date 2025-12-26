"use client"

import type React from "react"

import { useState } from "react"
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
import type { Shop } from "@/lib/types"

interface EditShopDialogProps {
  shop: Shop
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (shop: Shop) => void
}

export function EditShopDialog({ shop, open, onOpenChange, onUpdate }: EditShopDialogProps) {
  const [shopName, setShopName] = useState(shop.shop_name)
  const [mobNo, setMobNo] = useState(shop.mob_no)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: updateError } = await supabase
      .from("shops")
      .update({
        shop_name: shopName,
        mob_no: mobNo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", shop.id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      setIsLoading(false)
      return
    }

    onUpdate(data)
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Shop</DialogTitle>
          <DialogDescription>Update shop details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editShopName">Shop Name</Label>
              <Input
                id="editShopName"
                placeholder="Enter shop name"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMobNo">Mobile Number</Label>
              <Input
                id="editMobNo"
                placeholder="Enter mobile number"
                value={mobNo}
                onChange={(e) => setMobNo(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
