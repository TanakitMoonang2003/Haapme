/**
 * POST /api/pages
 * Create a new birthday page.
 * Returns the page data plus a one-time owner token.
 */
import { connectDB } from '../../utils/db'
import { BirthdayPage } from '../../models/BirthdayPage'
import { generateToken, hashToken } from '../../utils/token'
import type { CreateBirthdayPageInput, CreateBirthdayPageResponse } from '../../../shared/types'

function daysUntilBirthday(dateOfBirth: string): number {
  const parts = dateOfBirth.split('-').map(Number)
  if (parts.length !== 3) return 0
  const [, month, day] = parts
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let target = new Date(now.getFullYear(), month! - 1, day!)
  if (target <= today) {
    target = new Date(now.getFullYear() + 1, month! - 1, day!)
  }
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateBirthdayPageInput>(event)

  // --- Validate ---
  const errors: string[] = []
  const nameRaw = (body?.displayName ?? '').toString().trim()
  const dobRaw = (body?.dateOfBirth ?? '').toString().trim()

  if (!dobRaw.match(/^\d{4}-\d{2}-\d{2}$/)) {
    errors.push('dateOfBirth ต้องอยู่ในรูปแบบ YYYY-MM-DD')
  } else {
    const d = new Date(dobRaw)
    if (isNaN(d.getTime())) errors.push('dateOfBirth ไม่ถูกต้อง')
  }

  if (nameRaw.length > 60) errors.push('displayName ยาวเกินไป (สูงสุด 60 ตัวอักษร)')

  if (errors.length) {
    throw createError({ statusCode: 400, message: errors.join(', ') })
  }

  // --- DB ---
  try {
    await connectDB()
  } catch {
    throw createError({ statusCode: 503, message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' })
  }

  const ownerToken = generateToken()
  const ownerTokenHash = hashToken(ownerToken)

  const page = await BirthdayPage.create({
    displayName: nameRaw || 'Birthday Person',
    dateOfBirth: dobRaw,
    ownerTokenHash,
  })

  const response: CreateBirthdayPageResponse = {
    page: {
      id: page._id.toString(),
      displayName: page.displayName,
      dateOfBirth: page.dateOfBirth,
      daysUntilBirthday: daysUntilBirthday(page.dateOfBirth),
      createdAt: page.createdAt.toISOString(),
    },
    ownerToken,
  }

  return response
})
