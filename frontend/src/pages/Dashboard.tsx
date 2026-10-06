import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Sprout, LogOut, User, ChevronRight } from "lucide-react"

interface UserData {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3002").replace(/\/+$/, "")

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    // Check for token in URL (from Google OAuth redirect)
    const urlToken = searchParams.get("token")
    const urlUser = searchParams.get("user")

    if (urlUser) {
      try {
        const parsedUser = JSON.parse(urlUser)
        localStorage.setItem("token", urlToken || localStorage.getItem("token") || "")
        localStorage.setItem("user", JSON.stringify(parsedUser))
        setUser(parsedUser)
        navigate("/dashboard", { replace: true })
        return
      } catch {
        navigate("/signin")
        return
      }
    }

    if (urlToken) {
      localStorage.setItem("token", urlToken)
      // Fetch user data with the token
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${urlToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user))
            setUser(data.user)
              navigate("/dashboard", { replace: true })
          }
        })
        .catch(() => {
          navigate("/signin")
        })
      return
    }

    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      navigate("/signin")
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch {
      navigate("/signin")
    }
  }, [navigate, searchParams])

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token")
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch {}
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("vaagai_token")
    localStorage.removeItem("vaagai_user_id")
    navigate("/signin")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sprout className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">AgriTech</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {user.firstName} {user.lastName}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold">Welcome, {user.firstName}!</h1>
          <p className="text-muted-foreground mt-2">
            Here's an overview of your farm operations
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-2">Farms</h3>
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground mt-1">Active farms</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-2">Active Tasks</h3>
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground mt-1">Pending tasks</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-2">Weather</h3>
              <p className="text-3xl font-bold text-primary">--</p>
              <p className="text-sm text-muted-foreground mt-1">Current location</p>
            </div>
          </div>

          <div className="mt-8 p-8 rounded-xl border border-dashed border-border bg-muted/30 text-center">
            <Sprout className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Get Started</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Create your first farm to start tracking crops, managing tasks, and getting AI-powered insights.
            </p>
            <Button className="mt-4 gap-2">
              Create Farm
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}