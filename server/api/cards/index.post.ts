/**
 * POST /api/cards
 * ส่งการ์ดอวยพร (+ contribution ถ้าต้องการ)
 *
 * - amount มาจาก client แต่ต้อง validate ก่อน
 * - QR สร้างจากเบอร์พร้อมเพย์ใน DB (ไม่เชื่อ client)
 * - ถ้าหน้านั้นยังไม่มีพร้อมเพย์ → ไม่สร้าง contribution
 */
import { connectDB } from '../../utils/db'
import { BirthdayPage } from '../../models/BirthdayPage'
import { GreetingCard } from '../../models/GreetingCard'
import { Contribution } from '../../models/Contribution'
import { generateToken, hashToken } from '../../utils/token'
import { validateAndMaskMessage } from '../../utils/profanity'
import { buildPromptpayQr, MAX_CONTRIBUTION_AMOUNT, paymentStatusLabel } from '../../utils/promptpayQr'
import type { CreateGreetingCardInput, CreateGreetingCardResponse } from '../../../shared/types'
import mongoose from 'mongoose'

const MAX_MSG = 500

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateGreetingCardInput>(event)

  // --- Validate input ---
  const errors: string[] = []

  const pageId = (body?.birthdayPageId ?? '').toString().trim()
  if (!pageId.match(/^[a-f\d]{24}$/i)) errors.push('birthdayPageId ไม่ถูกต้อง')

  const senderName = (body?.senderName ?? '').toString().trim()
  if (!senderName) errors.push('กรุณาระบุชื่อผู้ส่ง')
  if (senderName.length > 60) errors.push('ชื่อยาวเกินไป (สูงสุด 60 ตัวอักษร)')

  const rawMessage = (body?.message ?? '').toString()
  const msgValidation = validateAndMaskMessage(rawMessage, MAX_MSG)
  if (!msgValidation.ok) errors.push(msgValidation.error!)

  const targetYear = Number(body?.targetYear)
  const currentYear = new Date().getFullYear()
  if (!Number.isInteger(targetYear) || targetYear < currentYear || targetYear > currentYear + 10) {
    errors.push(`targetYear ต้องอยู่ระหว่าง ${currentYear} ถึง ${currentYear + 10}`)
  }

  // validate amount ถ้ามี
  const rawAmount = body?.contributionAmount
  let amount: number | null = null
  if (rawAmount !== undefined && rawAmount !== null && rawAmount !== 0) {
    amount = Number(rawAmount)
    if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_CONTRIBUTION_AMOUNT) {
      errors.push(`จำนวนเงินต้องเป็นจำนวนเต็ม 1–${MAX_CONTRIBUTION_AMOUNT} บาท`)
    }
  }

  if (errors.length) {
    throw createError({ statusCode: 400, message: errors.join('; ') })
  }

  // --- DB ---
  try {
    await connectDB()
  } catch {
    throw createError({ statusCode: 503, message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' })
  }

  // ดึง page พร้อม promptpayEncrypted (select: false ต้องระบุ explicitly)
  const page = await BirthdayPage.findById(pageId).select('+promptpayEncrypted')
  if (!page) throw createError({ statusCode: 404, message: 'ไม่พบหน้าวันเกิดนี้' })

  // ถ้าผู้อวยพรต้องการจ่าย แต่เจ้าของยังไม่กรอกพร้อมเพย์ → reject
  if (amount && !page.promptpayEncrypted) {
    throw createError({
      statusCode: 422,
      message: 'เจ้าของหน้ายังไม่ได้ตั้งค่าพร้อมเพย์',
    })
  }

  const visitorToken = generateToken()
  const visitorTokenHash = hashToken(visitorToken)

  const card = await GreetingCard.create({
    birthdayPageId: new mongoose.Types.ObjectId(pageId),
    senderName,
    message: msgValidation.masked,
    targetYear,
    visitorTokenHash,
    shuffleKey: Math.random(),
  })

  // --- สร้าง Contribution + QR (ถ้าต้องการ) ---
  let contributionData = null

  if (amount && page.promptpayEncrypted) {
    // สร้าง QR จากเบอร์ใน DB (ไม่ใช้ .env, ไม่รับเบอร์จาก client)
    let qrResult
    try {
      qrResult = await buildPromptpayQr(page.promptpayEncrypted, amount)
    } catch (e: unknown) {
      throw createError({ statusCode: 500, message: (e as Error).message })
    }

    const contribution = await Contribution.create({
      greetingCardId: card._id,
      birthdayPageId: page._id,
      amount,
      currency: 'THB',
      status: 'pending',
      qrExpiresAt: qrResult.qrExpiresAt,
    })

    contributionData = {
      id: contribution._id.toString(),
      greetingCardId: card._id.toString(),
      amount,
      currency: 'THB',
      status: 'pending' as const,
      statusLabel: paymentStatusLabel('pending'),
      qrCodeData: qrResult.qrDataUrl,
      qrExpiresAt: qrResult.qrExpiresAt.toISOString(),
      statusUpdatedAt: contribution.statusUpdatedAt.toISOString(),
    }
  }

  const response: CreateGreetingCardResponse = {
    card: {
      id: card._id.toString(),
      birthdayPageId: card.birthdayPageId.toString(),
      senderName: card.senderName,
      message: card.message,
      targetYear: card.targetYear,
      createdAt: card.createdAt.toISOString(),
    },
    visitorToken,
    ...(contributionData ? { contribution: contributionData } : {}),
  }

  return response
})
