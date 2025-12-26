"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Cctv, Loader2, AlertCircle, ArrowLeft, MailCheck } from "lucide-react"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const supabase = createClient()

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            })

            if (resetError) throw resetError

            setSuccess(true)
        } catch (err: any) {
            setError(err.message || "An error occurred while sending reset email")
        } finally {
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
                        Reset Password
                    </CardTitle>
                    <CardDescription className="text-center font-medium">
                        We'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in zoom-in duration-300">
                            <div className="p-4 bg-green-500/10 rounded-full">
                                <MailCheck className="h-12 w-12 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-black text-foreground uppercase tracking-tight">Check your email</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    We've sent a password reset link to <br />
                                    <span className="font-bold text-foreground">{email}</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 w-full">
                                <Link href="/" className="w-full">
                                    <Button className="w-full font-bold uppercase">
                                        Go to Dashboard
                                    </Button>
                                </Link>
                                <Link href="/login" className="w-full">
                                    <Button variant="outline" className="w-full font-bold uppercase">
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleResetRequest} className="space-y-4">
                            {error && (
                                <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-background/50"
                                    disabled={loading}
                                />
                            </div>
                            <Button type="submit" className="w-full font-bold uppercase py-6" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending Link...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
                {!success && (
                    <CardFooter className="flex flex-col items-center border-t border-primary/10 pt-6">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-sm text-primary hover:underline font-medium">
                                Go to Dashboard
                            </Link>
                            <span className="text-muted-foreground">•</span>
                            <Link href="/login" className="text-sm text-primary hover:underline flex items-center gap-2 font-medium">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Login
                            </Link>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}
