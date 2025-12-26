"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Cctv, Loader2, AlertCircle } from "lucide-react"

function LoginForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const authError = searchParams.get("error")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) throw signInError

            router.push("/")
            router.refresh()
        } catch (err: any) {
            setError(err.message || "An error occurred during sign in")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
            <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="space-y-1 flex flex-col items-center">
                    <div className="p-3 bg-primary/10 rounded-full mb-4">
                        <Cctv className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight text-center uppercase italic">
                        HK TRADER
                    </CardTitle>
                    <CardDescription className="text-center font-medium">
                        Admin Dashboard Login
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}
                        {authError === "unauthorized" && !error && (
                            <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p>You do not have administrator privileges.</p>
                            </div>
                        )}
                        {authError && !error && authError !== "unauthorized" && (
                            <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p>{authError}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-primary hover:underline font-medium"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-background/50"
                            />
                        </div>
                        <Button type="submit" className="w-full font-bold uppercase py-6" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                "Login to Dashboard"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col items-center border-t border-primary/10 pt-6 space-y-4">
                    <Link href="/" className="w-full">
                        <Button variant="outline" className="w-full font-bold uppercase gap-2 active:scale-95 transition-transform">
                            Go to Dashboard
                        </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground text-center">
                        Restricted access. Authorized personnel only.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
