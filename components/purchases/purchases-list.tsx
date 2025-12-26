"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Search, Package, Eye } from "lucide-react"
import { ViewPurchaseDialog } from "./view-purchase-dialog"
import type { PurchasedCamera, Shop } from "@/lib/types"

interface PurchasesListProps {
  initialPurchases: PurchasedCamera[]
  shops: Shop[]
}

export function PurchasesList({ initialPurchases, shops }: PurchasesListProps) {
  const [purchases, setPurchases] = useState<PurchasedCamera[]>(initialPurchases)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [shopFilter, setShopFilter] = useState<string>("all")
  const [viewingPurchase, setViewingPurchase] = useState<PurchasedCamera | null>(null)

  // Sync state with props when data is refreshed from server
  const [prevInitialPurchases, setPrevInitialPurchases] = useState(initialPurchases)
  if (initialPurchases !== prevInitialPurchases) {
    setPurchases(initialPurchases)
    setPrevInitialPurchases(initialPurchases)
  }

  const categories = [...new Set(purchases.map((p) => p.category))]

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.camera_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.serial_numbers.some((sn) => sn.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = categoryFilter === "all" || purchase.category === categoryFilter
    const matchesShop = shopFilter === "all" || purchase.shop_id === shopFilter
    return matchesSearch && matchesCategory && matchesShop
  })

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("purchased_cameras").delete().eq("id", id)
    if (!error) {
      setPurchases(purchases.filter((p) => p.id !== id))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Purchase Records ({filteredPurchases.length})
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={shopFilter} onValueChange={setShopFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Shop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shops</SelectItem>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.shop_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPurchases.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Camera Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.camera_type}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{purchase.category}</Badge>
                      </TableCell>
                      <TableCell>{purchase.shops?.shop_name || "Unknown"}</TableCell>
                      <TableCell>{purchase.quantity}</TableCell>
                      <TableCell>{formatCurrency(purchase.unit_price)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(purchase.unit_price * purchase.quantity)}
                      </TableCell>
                      <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setViewingPurchase(purchase)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Purchase</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this purchase record? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(purchase.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              {searchQuery || categoryFilter !== "all" || shopFilter !== "all"
                ? "No purchases found matching your filters"
                : "No purchases recorded yet"}
            </div>
          )}
        </CardContent>
      </Card>

      {viewingPurchase && (
        <ViewPurchaseDialog
          purchase={viewingPurchase}
          open={!!viewingPurchase}
          onOpenChange={(open) => !open && setViewingPurchase(null)}
        />
      )}
    </>
  )
}
