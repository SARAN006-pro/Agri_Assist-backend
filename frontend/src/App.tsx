import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"

const Landing = lazy(() => import("./pages/Landing"))
const Demo = lazy(() => import("./pages/Demo"))
const SignIn = lazy(() => import("./pages/SignIn"))
const SignUp = lazy(() => import("./pages/SignUp"))
const AuthCallback = lazy(() => import("./pages/AuthCallback"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const Analytics = lazy(() => import("./pages/Analytics"))
const Calendar = lazy(() => import("./pages/Calendar"))
const Chat = lazy(() => import("./pages/Chat"))
const Economics = lazy(() => import("./pages/Economics"))
const Farm = lazy(() => import("./pages/Farm"))
const Irrigation = lazy(() => import("./pages/Irrigation"))
const Market = lazy(() => import("./pages/Market"))
const Recommend = lazy(() => import("./pages/Recommend"))
const Records = lazy(() => import("./pages/Records"))
const Sensors = lazy(() => import("./pages/Sensors"))
const Settings = lazy(() => import("./pages/Settings"))
const Weather = lazy(() => import("./pages/Weather"))
const FarmPage = lazy(() => import("./components/farm3d/FarmPage"))
const FloatingChatBot = lazy(() => import("./components/FloatingChatBot"))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const token = localStorage.getItem("token") || localStorage.getItem("vaagai_token")
  const user = localStorage.getItem("user")

  if (!token || !user) {
    const urlToken = new URLSearchParams(location.search).get("token")
    const urlUser = new URLSearchParams(location.search).get("user")
    if (location.pathname === "/dashboard" && urlToken && urlUser) {
      return children
    }
    return <Navigate to="/signin" replace />
  }

  return children
}

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/google/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/economics" element={<ProtectedRoute><Economics /></ProtectedRoute>} />
          <Route path="/farm" element={<ProtectedRoute><FarmPage /></ProtectedRoute>} />
          <Route path="/irrigation" element={<ProtectedRoute><Irrigation /></ProtectedRoute>} />
          <Route path="/market" element={<ProtectedRoute><Market /></ProtectedRoute>} />
          <Route path="/recommend" element={<ProtectedRoute><Recommend /></ProtectedRoute>} />
          <Route path="/records" element={<ProtectedRoute><Records /></ProtectedRoute>} />
          <Route path="/sensors" element={<ProtectedRoute><Sensors /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
        </Routes>
        {typeof window !== 'undefined' && (localStorage.getItem('token') || localStorage.getItem('vaagai_token')) ? (
          <Suspense fallback={null}><FloatingChatBot /></Suspense>
        ) : null}
      </Suspense>
    </BrowserRouter>
  )
}

export default App
