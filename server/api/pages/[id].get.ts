/**
 * GET /api/pages/:id
 * Fetch a birthday page's public info (no cards).
 */
import { connectDB } from '../../utils/db'
import { BirthdayPage } from '../../models/BirthdayPage'

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
  const id = getRouterParam(event, 'id')
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    throw createError({ statusCode: 400, message: 'รหัสหน้าวันเกิดไม่ถูกต้อง' })
  }

  try {
    await connectDB()
  } catch {
    throw createError({ statusCode: 503, message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' })
  }

  const page = await BirthdayPage.findById(id)
  if (!page) {
    throw createError({ statusCode: 404, message: 'ไม่พบหน้าวันเกิดนี้' })
  }

  return {
    id: page._id.toString(),
    displayName: page.displayName,
    dateOfBirth: page.dateOfBirth,
    daysUntilBirthday: daysUntilBirthday(page.dateOfBirth),
    createdAt: page.createdAt.toISOString(),
  }
})
