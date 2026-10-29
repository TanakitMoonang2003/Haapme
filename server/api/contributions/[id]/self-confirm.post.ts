/**
 * POST /api/contributions/:id/self-confirm
 * ผู้อวยพรกด "โอนเงินสำเร็จแล้ว" → บันทึกการแจ้งเป็น paid_unverified
 *
 * Auth: Bearer <visitorToken> ของการ์ดที่ผูกกับ contribution นี้
 * ป้องกัน: ไม่ให้ใครกด confirm ของคนอื่นได้
 *
 * NOTE: เป็นเพียงการแจ้งจากผู้ส่ง ระบบไม่ได้ตรวจสอบสลิปหรือยืนยันยอดเงินจริง
 */
import { connectDB } from '../../../utils/db'
import { Contribution } from '../../../models/Contribution'
import { GreetingCard } from '../../../models/GreetingCard'
import { verifyToken } from '../../../utils/token'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    throw createError({ statusCode: 400, message: 'รหัสไม่ถูกต้อง' })
  }

  // ตรวจ visitor token
  const rawToken = (getHeader(event, 'authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!rawToken) {
    throw createError({ statusCode: 401, message: 'ต้องการ visitor token' })
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

  // ตรวจว่า visitor token ตรงกับการ์ดที่ผูกอยู่
  const card = await GreetingCard.findById(contribution.greetingCardId).select('+visitorTokenHash')
  if (!card || !verifyToken(rawToken, card.visitorTokenHash)) {
    throw createError({ statusCode: 403, message: 'ไม่มีสิทธิ์ยืนยันรายการนี้' })
  }

  // อนุญาตเฉพาะ pending เท่านั้น
  if (contribution.status !== 'pending') {
    return {
      ok: true,
      status: contribution.status,
      message: 'รายการนี้อัปเดตไปแล้ว',
    }
  }

  // ตรวจ QR หมดอายุหรือยัง
  if (new Date() > contribution.qrExpiresAt) {
    contribution.status = 'expired'
    contribution.statusUpdatedAt = new Date()
    await contribution.save()
    throw createError({ statusCode: 410, message: 'QR หมดอายุแล้ว กรุณาสร้างการ์ดใหม่' })
  }

  contribution.status = 'paid_unverified'
  contribution.statusUpdatedAt = new Date()
  await contribution.save()

  return {
    ok: true,
    status: 'paid_unverified',
    message: 'บันทึกการแจ้งโอนแล้ว',
  }
})
