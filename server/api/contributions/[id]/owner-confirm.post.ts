/**
 * POST /api/contributions/:id/owner-confirm
 * เจ้าของกด "ยืนยันได้รับเงินแล้ว" → เปลี่ยนสถานะเป็น paid
 *
 * Auth: Bearer <ownerToken> ของหน้าวันเกิด
 * เจ้าของต้องตรวจยอดในแอปธนาคารเองก่อนกด
 */
import { connectDB } from '../../../utils/db'
import { Contribution } from '../../../models/Contribution'
import { BirthdayPage } from '../../../models/BirthdayPage'
import { verifyToken } from '../../../utils/token'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    throw createError({ statusCode: 400, message: 'รหัสไม่ถูกต้อง' })
  }

  const rawToken = (getHeader(event, 'authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!rawToken) {
    throw createError({ statusCode: 401, message: 'ต้องการ owner token' })
  }

  try {
    await connectDB()
  } catch {
    throw createError({ statusCode: 503, message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' })
  }

  const contribution = await Contribution.findById(id)
  if (!contribution) {
    throw createError({ statusCode: 404, message: 'ไม่พบรายการชำระเงิน' })
  }

  // ตรวจว่า owner token ตรงกับหน้าวันเกิดที่ผูกอยู่
  const page = await BirthdayPage.findById(contribution.birthdayPageId).select('+ownerTokenHash')
  if (!page || !verifyToken(rawToken, page.ownerTokenHash)) {
    throw createError({ statusCode: 403, message: 'ไม่มีสิทธิ์ยืนยันรายการนี้' })
  }

  if (contribution.status === 'paid') {
    return { ok: true, status: 'paid', message: 'ยืนยันไปแล้ว' }
  }

  contribution.status = 'paid'
  contribution.statusUpdatedAt = new Date()
  await contribution.save()

  return { ok: true, status: 'paid' }
})
