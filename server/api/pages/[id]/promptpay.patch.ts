/**
 * PATCH /api/pages/:id/promptpay
 * เจ้าของกรอกพร้อมเพย์ของตัวเอง (เบอร์โทร หรือ เลขบัตรประชาชน)
 * ต้องส่ง Authorization: Bearer <ownerToken>
 *
 * รับ: { promptpayId: "0812345678" } หรือ { promptpayId: "1234567890123" }
 * ไม่คืนค่าพร้อมเพย์กลับเลย — คืนแค่ { ok: true }
 */
import { connectDB } from '../../../utils/db'
import { BirthdayPage } from '../../../models/BirthdayPage'
import { verifyToken } from '../../../utils/token'
import { encrypt, validatePromptpayId, normalizePromptpayId } from '../../../utils/crypto'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    throw createError({ statusCode: 400, message: 'รหัสหน้าวันเกิดไม่ถูกต้อง' })
  }

  const rawToken = (getHeader(event, 'authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!rawToken) {
    throw createError({ statusCode: 401, message: 'ต้องการ owner token' })
  }

  const body = await readBody<{ promptpayId?: string }>(event)
  const promptpayId = normalizePromptpayId((body?.promptpayId ?? '').trim())
  const { ok } = validatePromptpayId(promptpayId)

  if (!ok) {
    throw createError({
      statusCode: 400,
      message: 'พร้อมเพย์ต้องเป็นเบอร์โทร 10 หลัก (ขึ้นต้นด้วย 0) หรือเลขบัตรประชาชน 13 หลัก',
    })
  }

  try {
    await connectDB()
  } catch {
    throw createError({ statusCode: 503, message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' })
  }

  const page = await BirthdayPage.findById(id).select('+ownerTokenHash')
  if (!page) throw createError({ statusCode: 404, message: 'ไม่พบหน้าวันเกิดนี้' })
  if (!verifyToken(rawToken, page.ownerTokenHash)) {
    throw createError({ statusCode: 403, message: 'token ไม่ถูกต้อง' })
  }

  let encrypted
  try {
    encrypted = encrypt(promptpayId)
  } catch (e: unknown) {
    throw createError({ statusCode: 500, message: (e as Error).message })
  }

  page.promptpayEncrypted = encrypted
  await page.save()

  return { ok: true, hasPromptpay: true }
})
