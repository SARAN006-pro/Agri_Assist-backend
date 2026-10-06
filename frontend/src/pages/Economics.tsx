import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DollarSign, TrendingUp, TrendingDown, Calculator, Loader2 } from 'lucide-react'

interface MarginResult {
  total_cost: number
  total_revenue: number
  gross_profit: number
  profit_margin: number
  status: string
  cost_per_hectare: number
  breakeven_yield: number
  market_price: number | null
  potential_revenue: number
  potential_profit: number
  potential_margin: number
  breakdown: {
    seed_cost: number
    fertilizer_cost: number
    pesticide_cost: number
    labor_cost: number
  }
  recommendations: Array<{ type: string; message: string }>
}

interface MarketPrice {
  cropName: string
  market: string
  pricePerKg: number
  unit: string
}

export default function Economics() {
  const [cropName, setCropName] = useState('')
  const [area, setArea] = useState('1')
  const [seedCost, setSeedCost] = useState('')
  const [fertilizerCost, setFertilizerCost] = useState('')
  const [pesticideCost, setPesticideCost] = useState('')
  const [laborCost, setLaborCost] = useState('')
  const [expectedYield, setExpectedYield] = useState('')
  const [expectedPrice, setExpectedPrice] = useState('')
  const [result, setResult] = useState<MarginResult | null>(null)
  const [calculating, setCalculating] = useState(false)

  const { data: marketPrices } = useQuery({
    queryKey: ['market', 'prices'],
    queryFn: async () => {
      const res = await api.get<{ prices: MarketPrice[] }>('/api/market/prices')
      return res.data.prices
    },
  })

  const handleCalculate = async () => {
    setCalculating(true)
    try {
      const res = await api.post<MarginResult>('/api/economics/margin', {
        cropName: cropName || undefined,
        area_ha: parseFloat(area) || 1,
        seed_cost: parseFloat(seedCost) || 0,
        fertilizer_cost: parseFloat(fertilizerCost) || 0,
        pesticide_cost: parseFloat(pesticideCost) || 0,
        labor_cost: parseFloat(laborCost) || 0,
        expected_yield_kg: parseFloat(expectedYield) || 0,
        price_per_kg: parseFloat(expectedPrice) || 0,
      })
      setResult(res.data)
    } catch {
      setResult(null)
    } finally {
      setCalculating(false)
    }
  }

  const handleMarketPriceSelect = (crop: string, price: number) => {
    setCropName(crop)
    setExpectedPrice(price.toString())
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Economics</h1>
          <p className="page-subtitle">Calculate profit margins and analyze farm economics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator size={20} />
              Profit Margin Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cropName">Crop Name</Label>
                <Input id="cropName" value={cropName} onChange={(e) => setCropName(e.target.value)} placeholder="e.g. Rice" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area (ha)</Label>
                <Input id="area" type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seedCost">Seed Cost (₹)</Label>
                <Input id="seedCost" type="number" value={seedCost} onChange={(e) => setSeedCost(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fertilizerCost">Fertilizer Cost (₹)</Label>
                <Input id="fertilizerCost" type="number" value={fertilizerCost} onChange={(e) => setFertilizerCost(e.target.value)} placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pesticideCost">Pesticide Cost (₹)</Label>
                <Input id="pesticideCost" type="number" value={pesticideCost} onChange={(e) => setPesticideCost(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="laborCost">Labor Cost (₹)</Label>
                <Input id="laborCost" type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedYield">Expected Yield (kg)</Label>
                <Input id="expectedYield" type="number" value={expectedYield} onChange={(e) => setExpectedYield(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedPrice">Expected Price (₹/kg)</Label>
                <Input id="expectedPrice" type="number" value={expectedPrice} onChange={(e) => setExpectedPrice(e.target.value)} placeholder="0" />
              </div>
            </div>

            <Button onClick={handleCalculate} disabled={calculating} className="w-full">
              {calculating ? <Loader2 className="animate-spin" /> : <Calculator size={16} />}
              {calculating ? 'Calculating...' : 'Calculate Profit Margin'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign size={20} />
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Total Cost</div>
                    <div className="text-2xl font-bold">₹{result.total_cost.toLocaleString()}</div>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                    <div className="text-2xl font-bold">₹{result.total_revenue.toLocaleString()}</div>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Gross Profit</div>
                    <div className={`text-2xl font-bold ${result.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{result.gross_profit.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Profit Margin</div>
                    <div className={`text-2xl font-bold flex items-center gap-1 ${result.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.profit_margin >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      {result.profit_margin.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border text-sm">
                    <span className="text-muted-foreground">Cost per Hectare: </span>
                    <span className="font-semibold">₹{result.cost_per_hectare.toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-lg border text-sm">
                    <span className="text-muted-foreground">Breakeven Yield: </span>
                    <span className="font-semibold">{result.breakeven_yield.toFixed(1)} kg</span>
                  </div>
                </div>

                {result.market_price && (
                  <div className="p-3 rounded-lg border text-sm">
                    <span className="text-muted-foreground">Market Price: </span>
                    <span className="font-semibold">₹{result.market_price}/kg</span>
                    <span className="text-muted-foreground ml-2">| Potential Revenue: ₹{result.potential_revenue.toLocaleString()}</span>
                  </div>
                )}

                {result.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Recommendations</h4>
                    {result.recommendations.map((rec, idx) => (
                      <div key={idx} className={`p-3 rounded-lg text-sm ${
                        rec.type === 'positive' ? 'bg-green-50 border border-green-200' :
                        rec.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                        'bg-blue-50 border border-blue-200'
                      }`}>
                        {rec.message}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {marketPrices && marketPrices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} />
                  Market Prices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {marketPrices.slice(0, 20).map((price, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleMarketPriceSelect(price.cropName, price.pricePerKg)}
                      className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent text-sm text-left"
                    >
                      <span className="font-medium">{price.cropName}</span>
                      <span className="text-primary font-semibold">₹{price.pricePerKg}/{price.unit.replace('₹/', '')}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
