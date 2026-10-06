import { describe, it, expect } from 'vitest'

const profitMarginSchema = {
  parse: (data: any) => {
    const errors: Array<{ field: string; message: string }> = []
    if (data.seedCost !== undefined && data.seedCost < 0) errors.push({ field: 'seedCost', message: 'Must be non-negative' })
    if (data.fertilizerCost !== undefined && data.fertilizerCost < 0) errors.push({ field: 'fertilizerCost', message: 'Must be non-negative' })
    if (data.pesticideCost !== undefined && data.pesticideCost < 0) errors.push({ field: 'pesticideCost', message: 'Must be non-negative' })
    if (data.laborCost !== undefined && data.laborCost < 0) errors.push({ field: 'laborCost', message: 'Must be non-negative' })
    if (data.expectedYield !== undefined && data.expectedYield < 0) errors.push({ field: 'expectedYield', message: 'Must be non-negative' })
    if (data.expectedPrice !== undefined && data.expectedPrice < 0) errors.push({ field: 'expectedPrice', message: 'Must be non-negative' })
    if (errors.length > 0) throw new Error(JSON.stringify(errors))
    return data
  },
}

function calculateProfitMargin(data: any) {
  const cropName = data.crop || data.cropName || 'Unknown'
  const area = data.area || data.areaHa || 1
  const seedCost = data.seedCost || data.seedCost || 0
  const fertilizerCost = data.fertilizerCost || data.fertilizerCost || 0
  const pesticideCost = data.pesticideCost || data.pesticideCost || 0
  const laborCost = data.laborCost || data.laborCost || 0
  const totalCosts = seedCost + fertilizerCost + pesticideCost + laborCost
  const expectedYield = data.expectedYield || data.expectedYield || 0
  const expectedPrice = data.expectedPrice || data.expectedPrice || 0
  const expectedRevenue = expectedYield * expectedPrice
  const grossProfit = expectedRevenue - totalCosts
  const profitMargin = expectedRevenue > 0 ? (grossProfit / expectedRevenue) * 100 : 0

  let status = 'neutral'
  if (profitMargin > 30) status = 'excellent'
  else if (profitMargin > 15) status = 'good'
  else if (profitMargin > 0) status = 'low'
  else if (profitMargin < 0) status = 'loss'

  return { totalCosts, expectedRevenue, grossProfit, profitMargin, status }
}

describe('Economics - Profit Margin Calculation', () => {
  it('should calculate positive profit margin', () => {
    const result = calculateProfitMargin({
      seedCost: 1000,
      fertilizerCost: 2000,
      pesticideCost: 500,
      laborCost: 3000,
      expectedYield: 1000,
      expectedPrice: 10,
    })

    expect(result.totalCosts).toBe(6500)
    expect(result.expectedRevenue).toBe(10000)
    expect(result.grossProfit).toBe(3500)
    expect(result.profitMargin).toBe(35)
    expect(result.status).toBe('excellent')
  })

  it('should calculate loss status', () => {
    const result = calculateProfitMargin({
      seedCost: 5000,
      fertilizerCost: 5000,
      pesticideCost: 2000,
      laborCost: 8000,
      expectedYield: 500,
      expectedPrice: 8,
    })

    expect(result.grossProfit).toBeLessThan(0)
    expect(result.status).toBe('loss')
  })

  it('should handle zero costs gracefully', () => {
    const result = calculateProfitMargin({
      expectedYield: 100,
      expectedPrice: 5,
    })

    expect(result.totalCosts).toBe(0)
    expect(result.expectedRevenue).toBe(500)
    expect(result.grossProfit).toBe(500)
    expect(result.profitMargin).toBe(100)
  })

  it('should handle zero yield gracefully', () => {
    const result = calculateProfitMargin({
      seedCost: 1000,
      fertilizerCost: 2000,
      expectedYield: 0,
      expectedPrice: 10,
    })

    expect(result.expectedRevenue).toBe(0)
    expect(result.profitMargin).toBe(0)
    expect(result.status).toBe('neutral')
  })
})

describe('Economics - Input Validation', () => {
  it('should reject negative seed cost', () => {
    expect(() => profitMarginSchema.parse({ seedCost: -100 })).toThrow()
  })

  it('should reject negative fertilizer cost', () => {
    expect(() => profitMarginSchema.parse({ fertilizerCost: -50 })).toThrow()
  })

  it('should accept valid input', () => {
    const result = profitMarginSchema.parse({
      seedCost: 100,
      fertilizerCost: 200,
    })
    expect(result.seedCost).toBe(100)
  })
})
