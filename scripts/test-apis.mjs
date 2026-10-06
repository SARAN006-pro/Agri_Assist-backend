const API_URL = 'http://localhost:3002'

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE API TESTS ---')

  // 1. Health check
  const healthRes = await fetch(`${API_URL}/health`)
  const health = await healthRes.json()
  console.log('[1] Health Check:', health)

  // 2. Login
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'interview_test@farm.com', password: 'Password123!' }),
  })
  const loginData = await loginRes.json()
  console.log('[2] Login:', loginRes.status === 200 ? 'SUCCESS' : 'FAILED', loginData.user?.email)
  const token = loginData.token

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  // 3. Current User
  const meRes = await fetch(`${API_URL}/api/auth/me`, { headers: authHeaders })
  const me = await meRes.json()
  console.log('[3] Get Current User (/api/auth/me):', meRes.status, me.user?.role)

  // 4. Farms
  const farmsRes = await fetch(`${API_URL}/api/farms`, { headers: authHeaders })
  const farms = await farmsRes.json()
  console.log('[4] Farms (/api/farms):', farmsRes.status, Array.isArray(farms) ? `${farms.length} farms` : farms)

  // 5. Weather
  const weatherRes = await fetch(`${API_URL}/api/weather?lat=13.0827&lon=80.2707`, { headers: authHeaders })
  console.log('[5] Weather (/api/weather):', weatherRes.status)

  // 6. Market
  const marketRes = await fetch(`${API_URL}/api/market?limit=5`, { headers: authHeaders })
  console.log('[6] Market (/api/market):', marketRes.status)

  // 7. AI Insights
  const insightsRes = await fetch(`${API_URL}/api/ai-insights`, { headers: authHeaders })
  console.log('[7] AI Insights (/api/ai-insights):', insightsRes.status)

  // 8. Google OAuth Init endpoint
  const googleRes = await fetch(`${API_URL}/api/auth/google`, { redirect: 'manual' })
  console.log('[8] Google OAuth Init (/api/auth/google): Redirect Status', googleRes.status, 'Location header present:', googleRes.headers.has('location'))

  console.log('--- ALL ENDPOINTS TESTED ---')
}

runTests().catch(console.error)
