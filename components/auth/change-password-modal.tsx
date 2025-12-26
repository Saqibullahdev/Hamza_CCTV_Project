"use client"

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
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export function ChangePasswordModal() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [open, setOpen] = useState(false)

    const handleUpdatePassword = async (e: React.FormEvent) => {
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

        const supabase = createClient()
        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        })

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
        } else {
            setSuccess(true)
            setLoading(false)
            setPassword("")
            setConfirmPassword("")
            setTimeout(() => {
                setOpen(false)
                setSuccess(false)
            }, 2000)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <KeyRound className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Password</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                        Change Admin Password
                    </DialogTitle>
                    <DialogDescription>
                        Enter your new password below. You will be able to login with this new password immediately.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="py-6 flex flex-col items-center justify-center space-y-3 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 animate-in zoom-in duration-300" />
                        <p className="font-bold text-green-600">Password Updated Successfully!</p>
                        <p className="text-sm text-muted-foreground">The modal will close automatically.</p>
                    </div>
                ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4">
                        {error && (
                            <div className="bg-destructive/15 border border-destructive/30 text-destructive px-3 py-2 rounded-md flex items-center gap-2 text-xs">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="new-password text-[13px]">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password text-[13px]">Confirm New Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full font-bold uppercase" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Save New Password"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
