import { Router, Response } from 'express'
import { optionalAuth, AuthRequest } from '../auth/auth.middleware'
import prisma from '../../services/database'

const router = Router()

router.get('/overview', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.json({ areaPlanted: 0, estimatedYield: 0, tasksCompleted: 0, revenueEstimate: 0, trends: { areaPlanted: 0, estimatedYield: 0, tasksCompleted: 0, revenueEstimate: 0 } })
      return
    }

    const farms = await prisma.farm.findMany({
      where: { users: { some: { userId: req.user!.userId, isActive: true } }, isActive: true },
      include: { _count: { select: { cropPlans: true, tasks: true, yieldRecords: true } } },
    })

    const totalArea = farms.reduce((sum, f) => sum + (f.acreage || 0), 0)
    const totalCropPlans = farms.reduce((sum, f) => sum + f._count.cropPlans, 0)
    const totalYield = await prisma.yieldRecord.aggregate({ _sum: { quantity: true }, where: { farm: { users: { some: { userId: req.user!.userId } } } } })
    const totalRevenue = await prisma.yieldRecord.aggregate({ _sum: { revenue: true }, where: { farm: { users: { some: { userId: req.user!.userId } } } } })
    const completedTasks = await prisma.task.count({ where: { farm: { users: { some: { userId: req.user!.userId } } }, status: 'COMPLETED' } })

    res.json({
      areaPlanted: totalArea,
      estimatedYield: totalYield._sum.quantity || 0,
      tasksCompleted: completedTasks,
      revenueEstimate: totalRevenue._sum.revenue || 0,
      trends: {
        areaPlanted: 0,
        estimatedYield: 0,
        tasksCompleted: 0,
        revenueEstimate: 0,
      },
    })
  } catch (error) {
    console.error('Analytics overview error:', error)
    res.status(500).json({ error: 'Failed to fetch analytics overview' })
  }
})

router.get('/time-series', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.json([])
      return
    }

    const { metric, from } = req.query
    const days = from === '7d' ? 7 : from === '30d' ? 30 : from === '90d' ? 90 : from === '1y' ? 365 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    if (metric === 'tasks') {
      const tasks = await prisma.task.findMany({
        where: {
          farm: { users: { some: { userId: req.user!.userId } } },
          scheduledDate: { gte: startDate },
        },
        orderBy: { scheduledDate: 'asc' },
      })

      const series: Record<string, { date: string; value: number }> = {}
      tasks.forEach(t => {
        const key = t.scheduledDate.toISOString().split('T')[0]
        if (!series[key]) series[key] = { date: key, value: 0 }
        series[key].value++
      })

      res.json(Object.values(series).sort((a, b) => a.date.localeCompare(b.date)))
    } else {
      const records = await prisma.yieldRecord.findMany({
        where: {
          farm: { users: { some: { userId: req.user!.userId } } },
          harvestDate: { gte: startDate },
        },
        orderBy: { harvestDate: 'asc' },
      })

      const series: Record<string, { date: string; value: number }> = {}
      records.forEach(r => {
        const key = r.harvestDate.toISOString().split('T')[0]
        if (!series[key]) series[key] = { date: key, value: 0 }
        series[key].value += r.quantity
      })

      res.json(Object.values(series).sort((a, b) => a.date.localeCompare(b.date)))
    }
  } catch (error) {
    console.error('Analytics time-series error:', error)
    res.status(500).json({ error: 'Failed to fetch analytics time-series' })
  }
})

export default router
