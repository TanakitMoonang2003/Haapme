/**
 * GET /api/pages/:id/has-promptpay
 * ตรวจว่าเจ้าของหน้านี้กรอกพร้อมเพย์ไว้หรือยัง
 * ใช้โดย WishForm เพื่อตัดสินใจว่าจะแสดงตัวเลือก "ส่งกำลังใจเป็นเงิน" ไหม
 *
 * ไม่ต้อง auth — แต่ไม่คืนเบอร์หรือข้อมูลใดๆ นอกจาก boolean
 */
import { connectDB } from '../../../utils/db'
import { BirthdayPage } from '../../../models/BirthdayPage'

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

  // select เฉพาะ field ที่จำเป็น ไม่ดึง promptpayEncrypted มา
  const page = await BirthdayPage.findById(id).select('promptpayEncrypted')

  if (!page) throw createError({ statusCode: 404, message: 'ไม่พบหน้าวันเกิดนี้' })

  return {
    hasPromptpay: page.promptpayEncrypted !== null && page.promptpayEncrypted !== undefined,
  }
})
