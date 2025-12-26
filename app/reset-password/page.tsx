"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Cctv, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { error: resetError } = await supabase.auth.updateUser({
                password: password
            })

            if (resetError) throw resetError

            setSuccess(true)
            setTimeout(() => {
                router.push("/login")
            }, 3000)
        } catch (err: any) {
            setError(err.message || "An error occurred while resetting password")
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
                    <CardTitle className="text-2xl font-black tracking-tight text-center uppercase">
                        Set New Password
                    </CardTitle>
                    <CardDescription className="text-center font-medium">
                        Enter your new secure password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in zoom-in duration-300">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <div className="space-y-2">
                                <h3 className="font-black text-foreground uppercase tracking-tight">Password Reset!</h3>
                                <p className="text-sm text-muted-foreground">
                                    Your password has been updated. Redirecting to login...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {error && (
                                <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="bg-background/50"
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="bg-background/50"
                                    disabled={loading}
                                />
                            </div>
                            <Button type="submit" className="w-full font-bold uppercase py-6" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col items-center border-t border-primary/10 pt-6">
                    <Link href="/" className="text-sm text-primary hover:underline font-medium">
                        Go to Dashboard
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
