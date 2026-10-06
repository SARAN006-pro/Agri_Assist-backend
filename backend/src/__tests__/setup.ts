import { beforeAll, afterAll } from 'vitest'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.example' })

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/agritech_test'

beforeAll(() => {
})

afterAll(() => {
})
