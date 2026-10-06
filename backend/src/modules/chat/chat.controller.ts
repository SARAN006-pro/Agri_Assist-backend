import { Router, Response } from 'express'
import prisma from '../../services/database'
import { optionalAuth, AuthRequest } from '../auth/auth.middleware'
import llmService from '../../services/llm'

const router = Router()

// Chat Session model for database
interface ChatSession {
  id: string
  name: string
  deviceId: string
  createdAt: Date
  updatedAt: Date
}

interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  language?: string
  createdAt: Date
}

type ChatAction = {
  type: 'navigate'
  target: string
  label: string
}

function titleCaseWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function normalizeRegionName(value: string): string {
  return titleCaseWords(
    value
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim(),
  )
}

function extractMarketQuery(message: string): { crop: string; state: string } | null {
  const normalized = message
    .trim()
    .replace(/[?.!,]/g, ' ')
    .replace(/\s+/g, ' ')

  const patterns = [
    /(?:today'?s\s+|current\s+|latest\s+|now\s+)?(?:price|market price|rates?)\s+(?:of\s+)?(.+?)\s+(?:in|at|for)\s+(.+)$/i,
    /(.+?)\s+(?:today'?s\s+|current\s+|latest\s+|now\s+)?(?:price|market price|rates?)\s+(?:in|at|for)\s+(.+)$/i,
    /(?:price|market price|rates?)\s+for\s+(.+?)\s+(?:in|at|for)\s+(.+)$/i,
  ]

  for (const pattern of patterns) {
    const marketMatch = normalized.match(pattern)
    if (!marketMatch) continue

    const crop = (marketMatch[1] || '').replace(/\b(today|today's|current|latest|now)\b/gi, '').trim()
    const state = (marketMatch[2] || '').replace(/\b(today|today's|current|latest|now)\b/gi, '').trim()

    if (!crop || !state) continue

    return {
      crop: titleCaseWords(crop),
      state: normalizeRegionName(state),
    }
  }

  return null
}

function isDetailsIntent(message: string): boolean {
  return /\b(details?|detail|more info|more information|tell me about|give me about|about this)\b/i.test(message)
}

function isTodayTasksIntent(message: string): boolean {
  return /(today('?s)? tasks?|tasks? today|what.*today|what.*do.*today|schedule today|today schedule|task(s)? for today)/i.test(message)
}

function resolveDeviceId(req: AuthRequest, providedDeviceId?: string): string {
  return providedDeviceId || req.user?.userId || req.headers['x-device-id']?.toString() || 'anonymous'
}

function formatTaskTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function buildTodayTasksResponse(req: AuthRequest): Promise<{ reply: string; action: ChatAction; data: { tasks: Array<{ id: string; title: string; status: string; priority: string; farmName: string; cropName: string | null; scheduledTime: string }> } }> {
  if (!req.user?.userId) {
    return {
      reply: 'Please sign in to see your today\'s tasks. I can open Crop Planning after you log in.',
      action: { type: 'navigate', target: '/planning', label: 'Open Crop Planning' },
      data: { tasks: [] },
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const tasks = await prisma.task.findMany({
    where: {
      farm: { users: { some: { userId: req.user.userId, isActive: true } } },
      scheduledDate: { gte: today, lt: tomorrow },
    },
    include: {
      plan: { select: { cropName: true } },
      farm: { select: { name: true } },
    },
    orderBy: { scheduledDate: 'asc' },
  })

  const formattedTasks = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    farmName: task.farm?.name || 'Farm',
    cropName: task.plan?.cropName || null,
    scheduledTime: formatTaskTime(task.scheduledDate),
  }))

  if (formattedTasks.length === 0) {
    return {
      reply: 'You have no tasks scheduled for today. I opened Crop Planning so you can review or add tasks.',
      action: { type: 'navigate', target: '/planning', label: 'Open Crop Planning' },
      data: { tasks: [] },
    }
  }

  const preview = formattedTasks.slice(0, 5).map((task, index) => {
    const cropLabel = task.cropName ? ` for ${task.cropName}` : ''
    return `${index + 1}. ${task.title}${cropLabel} at ${task.scheduledTime} on ${task.farmName} (${task.priority}, ${task.status})`
  })

  const remainingCount = formattedTasks.length - preview.length

  return {
    reply: [
      `Here are your today's tasks (${formattedTasks.length}):`,
      ...preview,
      remainingCount > 0 ? `...and ${remainingCount} more task(s).` : '',
      'I opened Crop Planning so you can view the full schedule and mark tasks complete.',
    ].filter(Boolean).join('\n'),
    action: { type: 'navigate', target: '/planning', label: 'Open Crop Planning' },
    data: { tasks: formattedTasks },
  }
}

function buildMarketNavigationResponse(message: string): { reply: string; action: ChatAction } | null {
  const parsed = extractMarketQuery(message)
  if (!parsed) return null

  const params = new URLSearchParams()
  params.set('crop', parsed.crop)
  params.set('state', parsed.state)

  return {
    reply: `I opened Market Prices for ${parsed.crop} in ${parsed.state} and selected those filters for you.`,
    action: {
      type: 'navigate',
      target: `/market?${params.toString()}`,
      label: 'Open Market Prices',
    },
  }
}

// Create chat session
router.post('/sessions', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body
    const deviceId = resolveDeviceId(req, req.body.device_id)

    const session = await prisma.$executeRaw`
      INSERT INTO "chat_sessions" (id, name, device_id, "created_at", "updated_at")
      VALUES (gen_random_uuid(), ${name || 'New Chat'}, ${deviceId}, NOW(), NOW())
      RETURNING *
    `

    res.status(201).json({ message: 'Session created' })
  } catch (error) {
    console.error('Create session error:', error)
    res.status(500).json({ error: 'Failed to create session' })
  }
})

// Get all chat sessions
router.get('/sessions', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deviceId = resolveDeviceId(req, req.query.device_id as string)

    const sessions = await prisma.$queryRaw<ChatSession[]>`
      SELECT * FROM "chat_sessions"
      WHERE device_id = ${deviceId}
      ORDER BY "updated_at" DESC
      LIMIT 50
    `

    res.json(sessions || [])
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({ error: 'Failed to get sessions' })
  }
})

// Delete chat session
router.delete('/sessions/:sessionId', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params

    await prisma.$executeRaw`
      DELETE FROM "chat_messages" WHERE session_id = ${sessionId}
    `
    await prisma.$executeRaw`
      DELETE FROM "chat_sessions" WHERE id = ${sessionId}
    `

    res.json({ message: 'Session deleted' })
  } catch (error) {
    console.error('Delete session error:', error)
    res.status(500).json({ error: 'Failed to delete session' })
  }
})

// Rename chat session
router.patch('/sessions/:sessionId', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params
    const { name } = req.body

    await prisma.$executeRaw`
      UPDATE "chat_sessions"
      SET name = ${name}, "updated_at" = NOW()
      WHERE id = ${sessionId}
    `

    res.json({ message: 'Session renamed' })
  } catch (error) {
    console.error('Rename session error:', error)
    res.status(500).json({ error: 'Failed to rename session' })
  }
})

// Get chat history
router.get('/history/:sessionId', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params
    const limit = parseInt(req.query.limit as string) || 100

    const messages = await prisma.$queryRaw<ChatMessage[]>`
      SELECT * FROM "chat_messages"
      WHERE session_id = ${sessionId}
      ORDER BY "created_at" ASC
      LIMIT ${limit}
    `

    res.json(messages || [])
  } catch (error) {
    console.error('Get history error:', error)
    res.status(500).json({ error: 'Failed to get chat history' })
  }
})

// Send chat message
router.post('/', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, session_id, history, language, device_id } = req.body
    const resolvedDeviceId = resolveDeviceId(req, device_id)

    // Create or update session
    let sessionId = session_id
    if (!sessionId) {
      const newSession = await prisma.$queryRaw<[{ id: string }]>`
        INSERT INTO "chat_sessions" (id, name, device_id, "created_at", "updated_at")
        VALUES (gen_random_uuid(), ${message.substring(0, 50)}, ${resolvedDeviceId}, NOW(), NOW())
        RETURNING id
      `
      sessionId = newSession[0]?.id
    }

    // Save user message
    await prisma.$executeRaw`
      INSERT INTO "chat_messages" (id, session_id, role, content, language, "created_at")
      VALUES (gen_random_uuid(), ${sessionId}, 'user', ${message}, ${language || 'en'}, NOW())
    `

    // Generate AI response using LLM service
    let aiResponse = ''
    let action: ChatAction | undefined
    let responseData: { tasks?: Array<{ id: string; title: string; status: string; priority: string; farmName: string; cropName: string | null; scheduledTime: string }> } | undefined
    try {
      const marketResponse = buildMarketNavigationResponse(message)
      if (marketResponse) {
        aiResponse = marketResponse.reply
        action = marketResponse.action
      } else if (isTodayTasksIntent(message)) {
        const todayTasks = await buildTodayTasksResponse(req)
        aiResponse = todayTasks.reply
        action = todayTasks.action
        responseData = todayTasks.data
      } else if (isDetailsIntent(message)) {
        const detailsTarget = message.toLowerCase().includes('plot') || message.toLowerCase().includes('farm')
          ? '/plot-details'
          : '/recommendations'

        aiResponse = 'I opened the most relevant details page so you can review the full information there.'
        action = {
          type: 'navigate',
          target: detailsTarget,
          label: 'Open Details',
        }
      } else {
        const historyMessages = (history || []).map((h: { role: string; content: string }) => ({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.content,
        }))
        const llmResult = await llmService.generateResponse(message, historyMessages, language || 'en')
        aiResponse = llmResult.content
      }
    } catch (llmError) {
      console.error('LLM generation failed, using fallback:', llmError)
      // Fallback to rule-based response if LLM fails
      aiResponse = generateAIResponse(message, history || [])
    }

    // Save assistant message
    await prisma.$executeRaw`
      INSERT INTO "chat_messages" (id, session_id, role, content, language, "created_at")
      VALUES (gen_random_uuid(), ${sessionId}, 'assistant', ${aiResponse}, ${language || 'en'}, NOW())
    `

    // Update session timestamp
    await prisma.$executeRaw`
      UPDATE "chat_sessions" SET "updated_at" = NOW() WHERE id = ${sessionId}
    `

    res.json({
      reply: aiResponse,
      response: aiResponse,
      session_id: sessionId,
      action,
      data: responseData,
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Failed to process message' })
  }
})

// Simple AI response generator (placeholder for real AI integration)
function generateAIResponse(message: string, history: any[]): string {
  const lowerMessage = message.toLowerCase()

  // Farming-related responses
  if (lowerMessage.includes('crop') || lowerMessage.includes('plant')) {
    return "For crop recommendations, I analyze soil type, climate, and market prices. Would you like me to suggest the best crops for your farm?"
  }

  if (lowerMessage.includes('weather') || lowerMessage.includes('rain')) {
    return "I can help you track weather patterns and forecast. Check the Weather page for detailed forecasts in your area."
  }

  if (lowerMessage.includes('price') || lowerMessage.includes('market')) {
    return "Market prices vary by region and season. Visit the Market page to see current prices for your crops."
  }

  if (lowerMessage.includes('water') || lowerMessage.includes('irrigation')) {
    return "Proper irrigation is crucial for crop yield. I can help you optimize your watering schedule based on weather and soil moisture."
  }

  if (lowerMessage.includes('fertilizer') || lowerMessage.includes('nutrient')) {
    return "Fertilizer requirements depend on soil test results and crop needs. Would you like guidance on nutrient management?"
  }

  if (lowerMessage.includes('pest') || lowerMessage.includes('disease')) {
    return "For pest and disease management, I recommend integrated pest management (IPM). Would you like specific recommendations?"
  }

  // Default farming assistant response
  return "I'm your smart farming assistant. I can help you with crop planning, weather tracking, market prices, irrigation advice, and more. What would you like to know?"
}

// Export chat history
router.get('/export/:sessionId', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params
    const format = req.query.format || 'json'

    const messages = await prisma.$queryRaw<ChatMessage[]>`
      SELECT * FROM "chat_messages"
      WHERE session_id = ${sessionId}
      ORDER BY "created_at" ASC
    `

    const session = await prisma.$queryRaw<[{ name: string }]>`
      SELECT name FROM "chat_sessions" WHERE id = ${sessionId}
    `

    if (format === 'text') {
      const text = messages.map(m =>
        `${m.role === 'user' ? 'You' : 'Assistant'}: ${m.content}`
      ).join('\n\n')
      res.setHeader('Content-Type', 'text/plain')
      res.send(text)
    } else {
      res.json({
        session: session[0]?.name || 'Chat',
        messages: messages || [],
        exportedAt: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ error: 'Failed to export chat' })
  }
})

export default router