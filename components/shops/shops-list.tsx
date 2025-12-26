"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Pencil, Trash2, Search, Phone, Store } from "lucide-react"
import { EditShopDialog } from "./edit-shop-dialog"
import type { Shop } from "@/lib/types"

interface ShopsListProps {
  initialShops: Shop[]
}

export function ShopsList({ initialShops }: ShopsListProps) {
  const [shops, setShops] = useState<Shop[]>(initialShops)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingShop, setEditingShop] = useState<Shop | null>(null)

  const filteredShops = shops.filter(
    (shop) => shop.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) || shop.mob_no.includes(searchQuery),
  )

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("shops").delete().eq("id", id)
    if (!error) {
      setShops(shops.filter((shop) => shop.id !== id))
    }
  }

  const handleUpdate = (updatedShop: Shop) => {
    setShops(shops.map((shop) => (shop.id === updatedShop.id ? updatedShop : shop)))
    setEditingShop(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Registered Shops ({filteredShops.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredShops.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop Name</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell className="font-medium">{shop.shop_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {shop.mob_no}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(shop.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingShop(shop)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Shop</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{shop.shop_name}&quot;? This will also delete all
                                associated purchase records.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(shop.id)}
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
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              {searchQuery ? "No shops found matching your search" : "No shops added yet"}
            </div>
          )}
        </CardContent>
      </Card>

      {editingShop && (
        <EditShopDialog
          shop={editingShop}
          open={!!editingShop}
          onOpenChange={(open) => !open && setEditingShop(null)}
          onUpdate={handleUpdate}
        />
      )}
    </>
  )
}
