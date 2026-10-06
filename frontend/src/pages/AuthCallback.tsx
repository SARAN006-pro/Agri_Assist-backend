import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Loader2, Sprout } from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002"

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState("")
  const [status, setStatus] = useState("Processing your login...")

  useEffect(() => {
    const errorParam = searchParams.get("error")
    const token = searchParams.get("token")
    const userParam = searchParams.get("user")
    const code = searchParams.get("code")

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        google_auth_failed: "Google authentication was cancelled or encountered an error.",
        no_code: "No authorization code was received from Google.",
        oauth_not_configured: "Google OAuth is not configured on the server.",
        token_exchange_failed: "Failed to exchange token with Google.",
        user_info_failed: "Failed to retrieve user information from Google.",
        account_disabled: "Your account has been deactivated. Please contact support.",
        auth_failed: "Authentication failed. Please try again.",
      }
      setError(errorMessages[errorParam] || `Authentication failed: ${errorParam}`)
      return
    }

    // Direct token redirect from backend (GET /api/auth/google/callback redirect)
    if (token) {
      try {
        localStorage.setItem("token", token)
        localStorage.setItem("vaagai_token", token)
        if (userParam) {
          try {
            const parsedUser = JSON.parse(decodeURIComponent(userParam))
            localStorage.setItem("user", JSON.stringify(parsedUser))
          } catch {
            localStorage.setItem("user", userParam)
          }
        }
        setStatus("Login successful! Redirecting to dashboard...")
        navigate("/dashboard", { replace: true })
        return
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to store session data")
        return
      }
    }

    if (!code) {
      setError("No authorization code or token received")
      return
    }

    // Authorization code exchange (frontend initiated or direct callback)
    const handleCallback = async () => {
      try {
        setStatus("Completing authentication...")

        const response = await fetch(`${API_URL}/api/auth/google/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Authentication failed")
        }

        localStorage.setItem("token", data.token)
        localStorage.setItem("vaagai_token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        navigate("/dashboard", { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication failed")
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Sprout className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">AgriTech</span>
          </div>
          <div className="p-6 bg-destructive/10 text-destructive rounded-lg">
            <p className="font-medium">Authentication Failed</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <a
            href="/signin"
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            Back to Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-medium">{status}</p>
        <p className="text-sm text-muted-foreground mt-2">Please wait...</p>
      </div>
    </div>
  )
}