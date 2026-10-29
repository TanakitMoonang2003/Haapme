/**
 * GET /api/pages/:id/cards/draw
 * Owner-only: draw the next random eligible card.
 *
 * Authorization: Bearer <ownerToken> in Authorization header.
 *
 * Advance wishes (targetYear > current year) are NEVER returned.
 * Their existence is acknowledged only as a count.
 *
 * Random draw strategy: each card has a `shuffleKey` (random 0-1).
 * We pick the card with the highest shuffleKey that has not been seen
 * recently (tracked by the client sending a `seen` query param of
 * comma-separated IDs). When all eligible cards have been seen the
 * client resets by sending no `seen` param.
 */
import { connectDB } from '../../../../utils/db'
import { BirthdayPage } from '../../../../models/BirthdayPage'
import { GreetingCard } from '../../../../models/GreetingCard'
import { verifyToken } from '../../../../utils/token'
import { Contribution } from '../../../../models/Contribution'
import { paymentStatusLabel } from '../../../../utils/promptpayQr'
import type { DrawCardResponse } from '../../../../../shared/types'
import mongoose from 'mongoose'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    throw createError({ statusCode: 400, message: 'รหัสหน้าวันเกิดไม่ถูกต้อง' })
  }

  // --- Authorise owner ---
  const authHeader = getHeader(event, 'authorization') ?? ''
  const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!rawToken) {
    throw createError({ statusCode: 401, message: 'ต้องการ token ของเจ้าของหน้า' })
  }

  try {
    await connectDB()
  } catch {
    throw createError({ statusCode: 503, message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' })
  }

  const page = await BirthdayPage.findById(id).select('+ownerTokenHash')
  if (!page) {
    throw createError({ statusCode: 404, message: 'ไม่พบหน้าวันเกิดนี้' })
  }

  if (!verifyToken(rawToken, page.ownerTokenHash)) {
    throw createError({ statusCode: 403, message: 'token ไม่ถูกต้อง' })
  }

  // --- Determine eligible year ---
  const now = new Date()
  const currentYear = now.getFullYear()

  // Parse dob to check if birthday has passed this year
  const dobParts = page.dateOfBirth.split('-').map(Number)
  const birthday = new Date(currentYear, dobParts[1]! - 1, dobParts[2]!)
  // If today is before birthday this year, eligible year is currentYear
  // If today is on/after birthday, eligible year is currentYear (cards for this year are readable)
  // Advance wishes = targetYear > currentYear
  const eligibleMaxYear = currentYear

  // --- Seen IDs from query ---
  const query = getQuery(event)
  const seenParam = typeof query.seen === 'string' ? query.seen : ''
  const seenIds = seenParam
    .split(',')
    .filter(s => /^[a-f\d]{24}$/i.test(s))
    .map(s => new mongoose.Types.ObjectId(s))

  // --- Count totals ---
  const pageObjId = new mongoose.Types.ObjectId(id)

  const [totalEligible, advanceWishCount] = await Promise.all([
    GreetingCard.countDocuments({
      birthdayPageId: pageObjId,
      targetYear: { $lte: eligibleMaxYear },
    }),
    GreetingCard.countDocuments({
      birthdayPageId: pageObjId,
      targetYear: { $gt: eligibleMaxYear },
    }),
  ])

  // --- Draw a card ---
  // Prefer unseen cards; if all seen, draw from the full eligible set
  let card = null

  if (seenIds.length > 0 && totalEligible > seenIds.length) {
    card = await GreetingCard.findOne({
      birthdayPageId: pageObjId,
      targetYear: { $lte: eligibleMaxYear },
      _id: { $nin: seenIds },
    })
      .sort({ shuffleKey: -1 })
      .select('-visitorTokenHash')
  }

  if (!card) {
    card = await GreetingCard.findOne({
      birthdayPageId: pageObjId,
      targetYear: { $lte: eligibleMaxYear },
    })
      .sort({ shuffleKey: -1 })
      .select('-visitorTokenHash')
  }

  // Re-roll shuffle key so next draw produces a different order
  if (card) {
    await GreetingCard.updateOne({ _id: card._id }, { shuffleKey: Math.random() })
  }

  // ดึง contribution ของการ์ดนี้ (ถ้ามี) — ไม่ส่ง QR คืนให้เจ้าของ
  let contribution = null
  if (card) {
    const contrib = await Contribution.findOne({ greetingCardId: card._id })
    if (contrib) {
      contribution = {
        id: contrib._id.toString(),
        amount: contrib.amount,
        currency: contrib.currency,
        status: contrib.status,
        statusLabel: paymentStatusLabel(contrib.status),
        statusUpdatedAt: contrib.statusUpdatedAt.toISOString(),
      }
    }
  }

  const response: DrawCardResponse = {
    card: card
      ? {
          id: card._id.toString(),
          birthdayPageId: card.birthdayPageId.toString(),
          senderName: card.senderName,
          message: card.message,
          targetYear: card.targetYear,
          createdAt: card.createdAt.toISOString(),
        }
      : null,
    contribution,
    totalEligible,
    advanceWishCount,
  }

  return response
})
