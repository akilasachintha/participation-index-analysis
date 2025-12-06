"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    setNeedsVerification(false)

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation is required
        setNeedsVerification(true)
      } else if (data.session) {
        // User is automatically signed in (email confirmation disabled)
        setSuccess(true)
        setTimeout(() => {
          router.push("/")
          router.refresh()
        }, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-amber-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-amber-900">Create Account</CardTitle>
          <CardDescription className="text-amber-700">
            Sign up for a new participation index account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {needsVerification ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border-2 border-blue-200 text-blue-900 px-4 py-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 mt-0.5 shrink-0 text-blue-600" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Check Your Email!</h3>
                    <p className="text-sm text-blue-800">
                      We've sent a verification email to <strong>{email}</strong>
                    </p>
                    <p className="text-sm text-blue-800">
                      Please click the link in the email to verify your account and complete registration.
                    </p>
                    <p className="text-xs text-blue-700 mt-3">
                      Can't find the email? Check your spam folder.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm font-semibold text-amber-900 hover:text-amber-600 underline"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <span className="text-sm">Account created successfully! Redirecting...</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-amber-900">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="border-amber-300 focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-amber-900">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-amber-300 focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-amber-900">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-amber-300 focus:border-amber-500"
              />
              <p className="text-xs text-amber-600">Must be at least 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-amber-900">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border-amber-300 focus:border-amber-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || success}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>

            <div className="text-center text-sm text-amber-700">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-amber-900 hover:text-amber-600 underline"
              >
                Sign in
              </Link>
            </div>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
