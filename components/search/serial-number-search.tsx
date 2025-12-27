"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Camera, Store, Phone, Calendar, Hash, Loader2 } from "lucide-react"
import type { PurchasedItem } from "@/lib/types"

interface SearchResult extends PurchasedItem {
  matchedSerialNumber: string
}

function SearchResultSkeleton() {
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
        <Skeleton className="h-4 w-60 mt-2" />
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
        <Separator />
        <div className="rounded-lg border border-border p-4">
          <Skeleton className="h-5 w-40 mb-3" />
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SerialNumberSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)

    const supabase = createClient()
    const { data } = await supabase
      .from("purchased_items")
      .select("*, shops(*)")
      .contains("serial_numbers", [query.trim()])

    const matchedResults: SearchResult[] = (data || []).map((item) => ({
      ...item,
      matchedSerialNumber: query.trim(),
    }))

    setResults(matchedResults)
    setIsSearching(false)
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
            <Search className="h-5 w-5" />
            Serial Number Lookup
          </CardTitle>
          <CardDescription>Enter a serial number to find the product and its purchase details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter serial number..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={isSearching || !query.trim()}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isSearching && (
        <div className="space-y-4">
          <SearchResultSkeleton />
        </div>
      )}

      {hasSearched && !isSearching && (
        <div className="space-y-4">
          {results.length > 0 ? (
            results.map((result) => (
              <Card key={result.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      {result.product_name || result.item_type}
                    </CardTitle>
                    <Badge variant="secondary">{result.category}</Badge>
                  </div>
                  <CardDescription>
                    Matched serial number: <span className="font-mono font-semibold">{result.matchedSerialNumber}</span>
                  </CardDescription>
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
                          <span className="text-muted-foreground">Serial Number:</span>
                          <span className="font-mono font-medium">{result.matchedSerialNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span className="font-medium">{result.category}</span>
                        </div>
                        {result.brand && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Brand:</span>
                            <span className="font-medium">{result.brand}</span>
                          </div>
                        )}
                        {result.model_code && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Model:</span>
                            <span className="font-mono font-medium">{result.model_code}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Unit Price:</span>
                          <span className="font-medium">{formatCurrency(result.unit_price)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Purchase Date:</span>
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="h-3 w-3" />
                            {new Date(result.purchase_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Quantity in Batch:</span>
                          <span className="font-medium">{result.quantity}</span>
                        </div>
                        {result.payment_method && (
                          <>
                            <Separator className="my-2" />
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Payment:</span>
                              <span className="font-medium">{result.payment_method}</span>
                            </div>
                            {(result.remaining_amount ?? 0) > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Remaining:</span>
                                <span className="font-medium text-destructive">
                                  {formatCurrency(result.remaining_amount ?? 0)}
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
                          <span className="font-medium">{result.shops?.shop_name || "Unknown"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Mobile Number:</span>
                          <span className="flex items-center gap-1 font-medium">
                            <Phone className="h-3 w-3" />
                            {result.shops?.mob_no || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="rounded-lg border border-border p-4">
                    <h3 className="mb-3 font-semibold text-foreground flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      All Serial Numbers in This Purchase ({result.serial_numbers.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.serial_numbers.map((sn, index) => (
                        <Badge
                          key={index}
                          variant={sn === result.matchedSerialNumber ? "default" : "outline"}
                          className="font-mono"
                        >
                          {sn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">No products found with serial number &quot;{query}&quot;</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
