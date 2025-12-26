import { DashboardHeader } from "@/components/dashboard/header"
import { SerialNumberSearch } from "@/components/search/serial-number-search"

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Search by Serial Number</h1>
          <p className="text-muted-foreground">Find camera details and purchase history using serial numbers</p>
        </div>
        <SerialNumberSearch />
      </main>
    </div>
  )
}
